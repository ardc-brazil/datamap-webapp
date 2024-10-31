import Uppy from "@uppy/core";
import { Form, Formik } from "formik";
import { useSession } from "next-auth/react";
import { useState } from 'react';
import { MaterialSymbol } from "react-material-symbols";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { CreateDraftDatasetVersionRequest, CreateDraftDatasetVersionResponse, FileUploadAuthTokenRequest, FileUploadAuthTokenResponse, GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse, PublishDatasetVersionRequest } from "../../../types/BffAPI";
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
    }

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

    function onCreate() {
        setProcessState(ProcessState.CREATING);
        const request = {
            datasetId: props.dataset.id,
            datafilesPreviouslyUploaded: stagingDatasetVersion.files_in
        } as CreateDraftDatasetVersionRequest;

        let versionCreated: CreateDraftDatasetVersionResponse;

        // Creates the new version with
        bffGateway
            .createNewDraftDatasetVersion(request)
            // starts the upload
            .then((resp) => {
                versionCreated = resp;
                return uppyReference.upload();
            })
            // publish the new version
            .then(async (uploadResult) => {
                setProcessState(ProcessState.ALL_FILES_UPLOADED);

                if (uploadResult.failed.length > 0) {
                    console.log("upload failed", uploadResult.failed);
                }

                const request = {
                    datasetId: props.dataset.id,
                    tenancies: [props.dataset.tenancy],
                    user_id: session?.user?.uid,
                    versionName: versionCreated.name,
                } as PublishDatasetVersionRequest;

                // Sleep 1 sec to create a nice experience for users
                await sleep(1000)
                
                return await bffGateway.publishDatasetVersion(request)                
            })
            .then(() => {
                setProcessState(ProcessState.DONE);
            })
            // catch all errors
            .catch(apiError => {
                setProcessState(ProcessState.OPEN);
                alert("Sorry! Error...");
                console.log(apiError)
            });
    }

    return (
        <Drawer
            title="Upload Data"
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
                    {stagingDatasetVersion?.files_in?.length > 0 &&
                        <>
                            <h2 className="py-2 text-primary-500 font-semibold text-xs uppercase border-b border-b-primary-200">
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

                    <h2 className="py-2 text-primary-500 font-semibold text-xs uppercase">
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
        <div data-testid="new-version-success-message" className="p-8 text-center">
            <MaterialSymbol icon="check" size={96} grade={-25} weight={400} className="text-success-700" />
            <h6>Success!</h6>
            <p>Your dataset version was created successfully.</p>
        </div>
    )
}

function CreatingVersionMessage() {
    return (
        <div data-testid="new-version-creating-message" className="p-8 text-center">
            <MaterialSymbol icon="progress_activity" size={96} grade={-25} weight={400}
                className="align-middle animate-spin"
            />
            <h6>Your dataset version is being created</h6>
            <p>If your dataset is public, users will see the previous version during processing.</p>
        </div>
    )
}
