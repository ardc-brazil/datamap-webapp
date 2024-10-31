import Uppy from "@uppy/core";
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from "formik";
import { useSession } from "next-auth/react";
import Router from "next/router";
import { useEffect, useState } from "react";
import { TabPanel } from "../../../components/DatasetDetails/TabPanel";
import { Tabs } from "../../../components/DatasetDetails/Tabs";
import LayoutFullScreen from "../../../components/LayoutFullScreen";
import LoggedLayout from "../../../components/LoggedLayout";
import Alert from "../../../components/base/Alert";
import Modal from "../../../components/base/PopupModal";
import UppyUploader from "../../../components/base/UppyUploader";
import { ROUTE_PAGE_DATASETS_DETAILS } from "../../../contants/InternalRoutesConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
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
  const [showModal, setShowModal] = useState(false);
  const [datasetCreateResponse, setDatasetCreateResponse] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [datasetPrototyping, setDatasetPrototyping] = useState({} as DatasetPrototyping);
  const [uppyReference, setUppyReference] = useState(null as Uppy);

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
    remoteFilesCount: 0
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

    uploadFiles()
      .then(() => updateDataset(datasetUpdateRequest))
      .then(() => {
        // Mapping to PublishDatasetVersionRequest
        const request = {
          datasetId: datasetPrototyping.createDatasetResponseV2.id,
          tenancies: [datasetPrototyping.createDatasetResponseV2.tenancy],
          user_id: session?.user?.uid,
          versionName: datasetPrototyping.createDatasetResponseV2.current_version.name
        } as PublishDatasetVersionRequest;

        return publishDatasetVersion(request);
      })
      .then(() => datasetCreated(datasetUpdateRequest))
      .then(() => actions.setSubmitting(false))
      .catch(error => {
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
        initialValues={initialValues}
        validate={handleValidateForm}
        onSubmit={handleSubmitForm}
      >
        {({ isSubmitting, values, setFieldTouched }) => (
          <Form>
            <LayoutFullScreen >
              <div className="max-w-2xl h-full">
                <Alert callout="Success" show={showSuccessAlert} closed={onAlertClose}>
                  <p className="font-bold">The dataset '{datasetCreateResponse?.name}' was created with success!</p>
                  <p>Now, you must fill in the maximum of details about the dataset to facilitate the future
                    searches and the data quality of the data platform.</p>
                </Alert>
                <h2 className="font-bold">New Dataset</h2>
                <p>Create a new dataset informing a title and remote data files.</p>
                <p className="text-xs">
                  A dataset refers to a collection of data that is organized and
                  structured for a specific purpose. It can consist of various types of
                  information such as text, numbers, images, audio, or video.
                </p>

                <div className="mt-8">
                  <h6 className=" font-bold">Dataset Identification</h6>
                  <p className="text-xs">
                    Give a unique name for your dataset that will be easy to identify and understand the meaning and possible uses for it.
                  </p>
                  <div className="my-2">
                    <label
                      htmlFor="datasetTitle"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Dataset title
                    </label>

                    <Field
                      type="text"
                      id="datasetTitle"
                      name="datasetTitle"
                      placeholder="Enter dataset title"
                      className="invalid:border-error-500"
                      onKeyDown={e => { e.key === 'Enter' && e.preventDefault() }}
                    />
                    <ErrorMessage
                      name="datasetTitle"
                      component="div"
                      className="text-xs text-error-600"
                    />

                  </div>

                  <h6 className="font-bold">Data files</h6>
                  <p className="text-xs">
                    Your dataset is composed of data files. You have to list all data files that compose your dataset using the options bellow.
                  </p>
                  <div className="my-2">
                    <Tabs>
                      <TabPanel title="File">
                        <div className="grid grid-cols-1 place-items-center py-2 h-64">
                          <UppyUploader
                            datasetId={datasetPrototyping?.createDatasetResponseV2?.id}
                            userId={datasetPrototyping?.fileUploadAuthTokenResponse?.user?.id}
                            userToken={datasetPrototyping?.fileUploadAuthTokenResponse?.token?.jwt}
                            onUppyStateCreated={onUppyStateCreated} />
                        </div>
                      </TabPanel>
                    </Tabs>
                  </div>
                </div>
                <br />
              </div>

              <div className="w-full h-24 border-t border-primary-200 ">
                <div className="container mx-auto max-w-3xl flex justify-end">
                  <button type="submit"
                    className="btn-primary mt-4"
                    disabled={isSubmitting || !(datasetPrototyping?.createDatasetResponseV2) || !(datasetPrototyping.fileUploadAuthTokenResponse)}
                  >
                    Create Dataset
                  </button>
                </div>
              </div>

            </LayoutFullScreen>
          </Form>
        )}
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