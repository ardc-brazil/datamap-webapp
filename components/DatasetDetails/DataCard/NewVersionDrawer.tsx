import Uppy from "@uppy/core";
import { Form, Formik } from "formik";
import { useSession } from "next-auth/react";
import { useState } from 'react';
import { MaterialSymbol } from "react-material-symbols";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { CreateDraftDatasetVersionRequest, CreateDraftDatasetVersionResponse, FileUploadAuthTokenRequest, FileUploadAuthTokenResponse, GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse, PublishDatasetVersionRequest } from "../../../types/BffAPI";
import { createVersionWithUploads, describeVersionCreationError } from "../../../lib/datasetVersionCreation";
import Drawer from "../../base/Drawer";
import UppyUploader from "../../base/UppyUploader";
import DatasetFilesList from "./DatasetFilesList";

interface NewVersionDrawerProps {
    onDrawerClose(newVersionCreated: boolean): void
    showUploadDataModal: boolean
    dataset: GetDatasetDetailsResponse
    datasetVersion: GetDatasetDetailsVersionResponse
}

enum ProcessState {
    OPEN,
    CREATING,
    ALL_FILES_UPLOADED,
    DONE,
}

export default function NewVersionDrawer(props: NewVersionDrawerProps) {
    const bffGateway = new BFFAPI();
    const { data: session, status } = useSession();
    const [stagingDatasetVersion, setStagingDatasetVersion] = useState(props.datasetVersion);
    const [uppyReference, setUppyReference] = useState(null as Uppy);
    const [uploadAuth, setUploadAuth] = useState({} as FileUploadAuthTokenResponse)
    const [processState, setProcessState] = useState(ProcessState.OPEN);
    const [errorMessage, setErrorMessage] = useState(null as string);

    async function onUppyStateCreated(uppy: Uppy) {
        const request = { file: { id: props.dataset.id } } as FileUploadAuthTokenRequest;

        // create upload token. This is valid for 1d
        await bffGateway.createUploadFileAuthToken(request)
            .then(fileUploadAuthTokenResponse => {
                setUploadAuth(fileUploadAuthTokenResponse);
            });

        // setup uppy componet
        setUppyReference(uppy);
    }

    function onDrawerOpen() {
        setStagingDatasetVersion(props.datasetVersion)
        setErrorMessage(null)
    }

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

    async function onCreate() {
        setErrorMessage(null);
        setProcessState(ProcessState.CREATING);

        const draftRequest = {
            datasetId: props.dataset.id,
            datafilesPreviouslyUploaded: stagingDatasetVersion.files_in
        } as CreateDraftDatasetVersionRequest;

        try {
            await createVersionWithUploads({
                createDraftVersion: () =>
                    bffGateway.createNewDraftDatasetVersion(draftRequest) as Promise<CreateDraftDatasetVersionResponse>,

                uploadFiles: () => uppyReference.upload(),

                publishVersion: async (versionName: string) => {
                    setProcessState(ProcessState.ALL_FILES_UPLOADED);

                    // Sleep 1 sec to create a nice experience for users
                    await sleep(1000);

                    return bffGateway.publishDatasetVersion({
                        datasetId: props.dataset.id,
                        tenancies: [props.dataset.tenancy],
                        user_id: session?.user?.uid,
                        versionName: versionName,
                    } as PublishDatasetVersionRequest);
                },
            });

            setProcessState(ProcessState.DONE);
        } catch (error) {
            console.error("dataset version creation failed", error);
            setErrorMessage(describeVersionCreationError(error));
            setProcessState(ProcessState.OPEN);
        }
    }

    return (
        <Drawer
            title="New version"
            show={props.showUploadDataModal}
            onOpen={onDrawerOpen}
            onClose={() => {
                props.onDrawerClose(processState == ProcessState.DONE)
            }}
            onClearAll={() => uppyReference.cancelAll()}
            onCreate={onCreate}
            showClearAllButton={processState == ProcessState.OPEN}
            showCreateButton={processState == ProcessState.OPEN}
            showCloseButton={processState == ProcessState.DONE}
        >

            {processState == ProcessState.ALL_FILES_UPLOADED &&
                <CreatingVersionMessage />
            }
            {processState == ProcessState.DONE &&
                <SuccessMessage />
            }
            {(processState == ProcessState.OPEN || processState == ProcessState.CREATING) &&
                <div>
                    {errorMessage &&
                        <div
                            data-testid="new-version-error-message"
                            role="alert"
                            className="mb-5 p-4 text-primary-900 border border-primary-200 border-l-4 border-l-error-600 bg-primary-0 rounded-md"
                        >
                            <h6 className="m-0 text-sm font-semibold">The version was not created</h6>
                            <p className="mt-1 mb-0 text-sm text-primary-700">{errorMessage}</p>
                            <p className="mt-2 mb-0 text-xs text-primary-500">
                                Nothing was published, so no version is missing files. Fix the problem above and try again.
                            </p>
                        </div>
                    }

                    {stagingDatasetVersion?.files_in?.length > 0 &&
                        <>
                            <h2 className="m-0 pb-2 text-[11px] leading-4 tracking-[0.08em] uppercase font-semibold text-primary-500">
                                Previously uploaded
                            </h2>
                            <DatasetFilesList
                                dataset={props.dataset}
                                datasetVersion={stagingDatasetVersion}
                                itemsPerPage={5}
                                onFileRemoved={(x) =>
                                    setStagingDatasetVersion(
                                        {
                                            ...setStagingDatasetVersion,
                                            files_in: stagingDatasetVersion.files_in.filter(y => y.id != x.id)
                                        } as GetDatasetDetailsVersionResponse
                                    )
                                }
                            />
                        </>
                    }

                    <h2 className="m-0 pt-6 pb-2 text-[11px] leading-4 tracking-[0.08em] uppercase font-semibold text-primary-500">
                        New uploads
                    </h2>
                    <div className="" >
                        <Formik initialValues={{ a: "test" }} onSubmit={() => { }}>
                            <Form>
                                <UppyUploader
                                    datasetId={props.dataset.id}
                                    userId={uploadAuth?.user?.id}
                                    // TODO: Check if the token is working
                                    userToken={uploadAuth?.token?.jwt}
                                    onUppyStateCreated={onUppyStateCreated} />
                            </Form>
                        </Formik>
                    </div>
                </div>
            }
        </Drawer>
    )
}

function SuccessMessage() {
    return (
        <div data-testid="new-version-success-message" className="flex flex-col items-center gap-2 px-8 py-12 text-center">
            <span className="flex items-center justify-center h-12 w-12 rounded-full bg-[#dcfce7] text-[#14532d]">
                <MaterialSymbol icon="check" size={24} grade={-25} weight={400} />
            </span>
            <h6 className="m-0 pt-2 text-base font-semibold text-primary-900">Version created</h6>
            <p className="m-0 text-sm text-primary-600">Your dataset version was created successfully.</p>
        </div>
    )
}

function CreatingVersionMessage() {
    return (
        <div data-testid="new-version-creating-message" className="flex flex-col items-center gap-2 px-8 py-12 text-center">
            <span className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-700">
                <MaterialSymbol icon="progress_activity" size={24} grade={-25} weight={400}
                    className="animate-spin"
                />
            </span>
            <h6 className="m-0 pt-2 text-base font-semibold text-primary-900">Your dataset version is being created</h6>
            <p className="m-0 text-sm text-primary-600">If your dataset is public, users will see the previous version during processing.</p>
        </div>
    )
}
