import Uppy from "@uppy/core";
import { ErrorMessage, Field, Form, Formik, FormikHelpers, FormikProps } from "formik";
import { useSession } from "next-auth/react";
import Router from "next/router";
import { useEffect, useRef, useState } from "react";
import { EmbargoChoice } from "../../../components/Embargo/EmbargoChoice";
import LayoutFullScreen from "../../../components/LayoutFullScreen";
import LoggedLayout from "../../../components/LoggedLayout";
import { useTenancyStore } from "../../../components/TenancyStore";
import Alert from "../../../components/base/Alert";
import Modal from "../../../components/base/PopupModal";
import UppyUploader from "../../../components/base/UppyUploader";
import { EDIT_FORM_ERROR_CLASS } from "../../../contants/EditFormConstants";
import { messageForApiError } from "../../../contants/EmbargoConstants";
import { ROUTE_PAGE_DATASETS_DETAILS } from "../../../contants/InternalRoutesConstants";
import { isDefaultTenancy } from "../../../contants/TenancyConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { EmbargoStepError, embargoLockFor, finishDatasetCreation } from "../../../lib/datasetCreation";
import { embargoRequestFrom, toEmbargoUntil, validateEmbargoDate } from "../../../lib/embargoDates";
import { formatShortDate, tenancyDisplayName } from "../../../lib/embargoDisplay";
import {
  CreateDatasetResponseV2,
  FileUploadAuthTokenRequest,
  FileUploadAuthTokenResponse,
  PublishDatasetVersionRequest,
  UpdateDatasetRequest
} from "../../../types/BffAPI";

interface DatasetPrototyping {
  createDatasetResponseV2: CreateDatasetResponseV2
  fileUploadAuthTokenResponse: FileUploadAuthTokenResponse
}

export default function NewPage() {
  const bffGateway = new BFFAPI();
  const { data: session } = useSession();
  const tenancySelected = useTenancyStore((state) => state.tenancySelected);
  const isPublicSelected = isDefaultTenancy(tenancySelected ?? "");
  const [showModal, setShowModal] = useState(false);
  const [datasetCreateResponse, setDatasetCreateResponse] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [datasetPrototyping, setDatasetPrototyping] = useState({} as DatasetPrototyping);
  const [uppyReference, setUppyReference] = useState(null as Uppy);
  const [embargoError, setEmbargoError] = useState(null as string | null);
  const [embargoSetUntil, setEmbargoSetUntil] = useState(null as string | null);
  const membersCanEditSent = useRef(false);
  const formikRef = useRef<FormikProps<FormValues>>(null);

  // Keeps a stale true from an earlier tenancy from surviving a switch to Public.
  useEffect(() => {
    if (isPublicSelected) {
      formikRef.current?.setFieldValue("membersCanEdit", false);
    }
  }, [isPublicSelected]);

  function datasetCreated(datasetResponse: any): void {
    setShowModal(true);
    setShowSuccessAlert(true);
    setDatasetCreateResponse(datasetResponse);
  }

  function viewDataset(): void {
    Router.push(ROUTE_PAGE_DATASETS_DETAILS(datasetCreateResponse));
  }

  const initialValues: FormValues = {
    datasetTitle: '',
    urls: [{ url: '', confirmed: false }],
    uploadedDataFiles: [],
    remoteFilesCount: 0,
    embargoMode: 'none',
    embargoUntil: '',
    embargoNote: '',
    membersCanEdit: false
  };

  function onAlertClose(): void {
    setShowSuccessAlert(false);
  }

  function handleValidateForm(values: FormValues) {
    const errors = {} as any;
    if (!values.datasetTitle) {
      errors.datasetTitle = "Required";
    }

    const confirmed = values.urls.filter(x => x && x.confirmed);
    if (confirmed.length <= 0 && values?.uploadedDataFiles?.length <= 0) {
      errors.remoteFilesCount = 'You have to informe almost one remote file.';
    }

    if (values.embargoMode && values.embargoMode !== "none") {
      const message = validateEmbargoDate(values.embargoUntil, new Date());
      if (message) {
        errors.embargoUntil = message;
      }
    }

    return errors;
  }

  async function uploadFiles() {
    return uppyReference.upload();
  }

  async function updateDataset(request: UpdateDatasetRequest) {
    return bffGateway.updateDataset(request);
  }

  async function publishDatasetVersion(request: PublishDatasetVersionRequest) {
    return bffGateway.publishDatasetVersion(request);
  }

  function handleSubmitForm(values: FormValues, actions: FormikHelpers<any>) {
    // Mapping datasetPrototyping.createDatasetResponseV2 top UpdateDatasetRequest
    datasetPrototyping.createDatasetResponseV2.data.authors = [{ name: session?.user?.name }]
    const datasetUpdateRequest = {
      id: datasetPrototyping.createDatasetResponseV2.id,
      name: values.datasetTitle,
      data: datasetPrototyping.createDatasetResponseV2.data,
      tenancy: datasetPrototyping.createDatasetResponseV2.tenancy,
      is_enabled: true,
    } as UpdateDatasetRequest;

    const embargoRequest = embargoRequestFrom(values);
    const datasetId = datasetPrototyping.createDatasetResponseV2.id;

    setEmbargoError(null);
    finishDatasetCreation({
      setEmbargo: embargoRequest
        ? async () => {
          const membersCanEdit = !isPublicSelected && values.membersCanEdit !== false;
          if (membersCanEdit !== membersCanEditSent.current) {
            await bffGateway.setMembersAccess(datasetId, { members_can_edit: membersCanEdit });
            membersCanEditSent.current = membersCanEdit;
          }
          return bffGateway.setEmbargo(datasetId, { ...embargoRequest, note: values.embargoNote?.trim() || null });
        }
        : null,
      embargoAlreadySet: embargoSetUntil !== null,
      onEmbargoSet: () => { setEmbargoSetUntil(embargoRequest?.until ?? null); },
      uploadFiles: () => uploadFiles(),
      updateDataset: () => updateDataset(datasetUpdateRequest),
      publishVersion: () => {
        // Mapping to PublishDatasetVersionRequest
        const request = {
          datasetId: datasetPrototyping.createDatasetResponseV2.id,
          tenancies: [datasetPrototyping.createDatasetResponseV2.tenancy],
          user_id: session?.user?.uid,
          versionName: datasetPrototyping.createDatasetResponseV2.current_version.name
        } as PublishDatasetVersionRequest;

        return publishDatasetVersion(request);
      },
    })
      .then(() => datasetCreated(datasetUpdateRequest))
      .catch(error => {
        if (error instanceof EmbargoStepError) {
          setEmbargoError(messageForApiError(error.apiError));
          return;
        }
        console.log("Erro when finish the dataset creation:", error);
        alert("Sorry! Error to create dataset.");
      })
      .finally(() => actions.setSubmitting(false));
  }

  function onUppyStateCreated(uppy: Uppy) {
    setUppyReference(uppy);
  }

  useEffect(() => {
    try {
      // Create a new dataset if the dataset prototyping is empty.
      if (!datasetPrototyping?.createDatasetResponseV2?.id) {
        bffGateway.createNewDataset({
          title: "",
        }).then(createDatasetResponseV2 => {
          const request = { file: { id: createDatasetResponseV2.id } } as FileUploadAuthTokenRequest;
          bffGateway.createUploadFileAuthToken(request)
            .then(fileUploadAuthTokenResponse => {
              setDatasetPrototyping({
                createDatasetResponseV2: createDatasetResponseV2,
                fileUploadAuthTokenResponse: fileUploadAuthTokenResponse
              });
            })
        })
      }
    } catch (error) {
      console.log("on-file-added error");
      console.log(error);
    }
  }, [datasetPrototyping])

  return (
    <LoggedLayout noPadding={false}>
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validate={handleValidateForm}
        onSubmit={handleSubmitForm}
      >
        {({ isSubmitting, values, setFieldTouched }) => {
          const embargoLock = embargoLockFor(embargoSetUntil);
          const footerEmbargoUntil = embargoSetUntil
            ?? (values.embargoMode !== "none" && values.embargoUntil ? toEmbargoUntil(values.embargoUntil) : null);

          return (
          <Form>
            <LayoutFullScreen title="New dataset" hint="Add a title and the data files to create it">
              <div className="flex flex-col gap-10">
                <Alert callout="Success" show={showSuccessAlert} closed={onAlertClose}>
                  <p className="font-bold">The dataset '{datasetCreateResponse?.name}' was created with success!</p>
                  <p>Now, you must fill in the maximum of details about the dataset to facilitate the future
                    searches and the data quality of the data platform.</p>
                </Alert>

                <div className="flex flex-col gap-2.5">
                  <h2 className="m-0 text-[30px] leading-[1.2] font-semibold tracking-tight text-primary-900">Create a dataset</h2>
                  <p className="m-0 text-[15px] leading-[23px] text-primary-600">
                    Give it a title and add the data files. You can fill in authors, license, coverage and the rest of the metadata after it's created.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="datasetTitle"
                    className="m-0 text-sm font-semibold text-primary-900"
                  >
                    Title
                  </label>

                  <Field
                    type="text"
                    id="datasetTitle"
                    name="datasetTitle"
                    placeholder="Enter dataset title"
                    className="h-11 py-0 px-3.5 bg-primary-0 border border-primary-300 rounded-md text-[15px] placeholder:text-primary-400 invalid:border-error-500"
                    onKeyDown={e => { e.key === 'Enter' && e.preventDefault() }}
                  />
                  <ErrorMessage
                    name="datasetTitle"
                    component="div"
                    className="text-xs text-error-600"
                  />
                  <span className="text-[13px] leading-[19px] text-primary-500">
                    Give a unique name for your dataset that will be easy to identify and understand the meaning and possible uses for it.
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap justify-between items-baseline gap-2">
                    <span className="text-sm font-semibold text-primary-900">Data files</span>
                    <span className="text-[13px] text-primary-500">Resumable uploads</span>
                  </div>
                  <UppyUploader
                    datasetId={datasetPrototyping?.createDatasetResponseV2?.id}
                    userId={datasetPrototyping?.fileUploadAuthTokenResponse?.user?.id}
                    userToken={datasetPrototyping?.fileUploadAuthTokenResponse?.token?.jwt}
                    onUppyStateCreated={onUppyStateCreated} />
                </div>

                <div className="flex flex-col gap-2">
                  <EmbargoChoice
                    tenancyName={tenancyDisplayName(tenancySelected)}
                    isPublic={isPublicSelected}
                    disabled={embargoLock.locked}
                    statusLine={embargoLock.statusLine}
                  />
                  {embargoError && <p role="alert" className={EDIT_FORM_ERROR_CLASS}>{embargoError}</p>}
                </div>
              </div>

              <div className="mx-auto w-full max-w-[640px] h-full px-4 sm:px-0 flex justify-between items-center gap-4">
                <span className="text-[13px] text-primary-500">
                  {values.remoteFilesCount} {values.remoteFilesCount === 1 ? "file" : "files"}
                  {footerEmbargoUntil && ` · embargo until ${formatShortDate(footerEmbargoUntil)}`}
                </span>
                <div className="flex gap-2">
                  <button type="button"
                    className="btn-primary-outline m-0"
                    onClick={() => Router.back()}
                  >
                    Cancel
                  </button>
                  <button type="submit"
                    className="btn-primary m-0"
                    disabled={isSubmitting || !(datasetPrototyping?.createDatasetResponseV2) || !(datasetPrototyping.fileUploadAuthTokenResponse)}
                  >
                    Create dataset
                  </button>
                </div>
              </div>
            </LayoutFullScreen>
          </Form>
          );
        }}
      </Formik>

      <Modal
        title="Create new Dataset"
        show={showModal}
        confimButtonText="View Dataset"
        cancel={() => setShowModal(false)}
        confim={viewDataset}
      >
        <div>
          <p className="font-bold">The dataset '{datasetCreateResponse?.name}' was created with success!</p>
          <p>Now, you must fill in the maximum of details about the dataset to facilitate the future
            searches and the data quality of the data platform.</p>
        </div>
      </Modal>
    </LoggedLayout >
  );
}

NewPage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};