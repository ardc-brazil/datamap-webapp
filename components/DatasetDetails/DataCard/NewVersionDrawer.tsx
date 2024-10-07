import Uppy from "@uppy/core";
import { Form, Formik } from "formik";
import { useState } from 'react';
import { BFFAPI } from "../../../gateways/BFFAPI";
import { FileUploadAuthTokenRequest, FileUploadAuthTokenResponse, GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse } from "../../../types/BffAPI";
import Drawer from "../../base/Drawer";
import UppyUploader from "../../base/UppyUploader";
import DatasetFilesList from "./DatasetFilesList";

interface NewVersionDrawerProps {
    onDrawerClose(): void
    showUploadDataModal: boolean
    dataset: GetDatasetDetailsResponse
    datasetVersion: GetDatasetDetailsVersionResponse
}

export default function NewVersionDrawer(props: NewVersionDrawerProps) {
    const bffGateway = new BFFAPI();
    const [stagingDatasetVersion, setStagingDatasetVersion] = useState(props.datasetVersion);
    const [uppyReference, setUppyReference] = useState(null as Uppy);
    const [uploadAuth, setUploadAuth] = useState({} as FileUploadAuthTokenResponse)

    function getToken() {
        const request = { file: { id: props.dataset.id } } as FileUploadAuthTokenRequest;
        bffGateway.createUploadFileAuthToken(request)
            .then(fileUploadAuthTokenResponse => {
                setUploadAuth(fileUploadAuthTokenResponse);
            })
    }

    function onUppyStateCreated(uppy: Uppy) {
        setUppyReference(uppy);
    }

    return (
        <Drawer
            title="Upload Data"
            show={props.showUploadDataModal}
            onOpen={() => setStagingDatasetVersion(props.datasetVersion)}
            onClose={props.onDrawerClose}
            onClearAll={() => {
                uppyReference.cancelAll()
            }}
            onCreate={() => {
                console.log("uploading");
                console.log("stagingDatasetVersion", stagingDatasetVersion)
                console.log("uppyReference", uppyReference);

                // TODO: Enable file upload
                // We need to create a new DatasetVersion before start 
                // uploading files to make sure that tusd will associate it with 
                // this new version
                // uppyReference.upload()

                // TODO: Publish version after upload everything
                // ---- how to avoid sync issues in webhooks?
                // If we publish after upload, and we have webhook delay,
                // the webhook will create a new version on draft staging
                // for last files
            }}
        >
            <div>
                {stagingDatasetVersion?.files?.length > 0 &&
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
                                        files: stagingDatasetVersion.files.filter(y => y.id != x.id)
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
                    {/* TODO: Config Formik correcly for this new form */}
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
        </Drawer>
    )
}
