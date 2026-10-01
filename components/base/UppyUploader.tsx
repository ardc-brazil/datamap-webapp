import Uppy, { UploadedUppyFile } from '@uppy/core';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Dashboard } from '@uppy/react';
import Tus from '@uppy/tus';
import { ErrorMessage, useFormikContext } from "formik";
import { useEffect, useState } from 'react';
import { trackUiEvent } from '../../lib/telemetryClient';

interface UppyUploaderProps {
    datasetId?: string
    userId?: string
    userToken?: string
    onFileUploaded?(success: UploadedUppyFile<Record<string, unknown>, Record<string, unknown>>): void
    onUppyStateCreated(uppy: Uppy);
}
interface DatasetPrototyping {
    id: string
    title?: string
}

export default function UppyUploader(props: UppyUploaderProps) {
    const formikContext = useFormikContext();

    // IMPORTANT: passing an initializer function to prevent Uppy from being reinstantiated on every render.
    const [uppy] = useState(() =>
        new Uppy({
            debug: false,
            meta: { "uid": "test1234" },
        }).use(Tus, {
            endpoint: getTusEndpoint(),
            removeFingerprintOnSuccess: true,
        }).on('file-added', (file) => {

            if (!formikContext) {
                return;
            }

            // Add file to the formik context to validate before submit
            const formikValues = (formikContext.values as FormValues)
            formikValues?.uploadedDataFiles?.push({
                id: file.id,
                name: file.name,
                extension: file.extension,
            })

            formikContext.setFieldValue("remoteFilesCount", formikValues?.uploadedDataFiles?.length, true);
        }).on('upload', () => {
            trackUiEvent("upload_started");
        }).on('upload-success', () => {
            trackUiEvent("upload_completed");
        }).on('upload-error', () => {
            trackUiEvent("upload_failed");
        }).on('file-removed', (file, reason) => {
            if (reason === 'removed-by-user') {
                if (!formikContext) {
                    return;
                }

                // TODO: Implement call to remove file after uploaded.
                // Remove file from the formik context to validate before submit
                const formikValues = (formikContext.values as FormValues)
                const index = formikValues?.uploadedDataFiles?.findIndex(x => x.id == file.id)
                if (index > -1) {
                    formikValues?.uploadedDataFiles?.splice(index, 1)
                    formikContext.setFieldValue("remoteFilesCount", formikValues?.uploadedDataFiles?.length, true);
                }
            }
        })
    );

    useEffect(() => {
        // Update user and token based on data change from the base page
        uppy.getPlugin('Tus').setOptions({
            headers: {
                "X-User-Id": props.userId,
                "X-User-Token": props.userToken,
            },
        })
    }, [props.userToken])

    useEffect(() => {
        // Update dataset id created based on data change from the base page
        uppy.setMeta({ "dataset_id": props.datasetId });
    }, [props.datasetId]);

    useEffect(() => {
        // TODO: Move the uppy component creation to a specific file to avoid
        // bubble it up.
        // Bubble up the uppy instance after created and configurated.
        props?.onUppyStateCreated?.(uppy);
    }, [uppy]);


    function getTusEndpoint() {
        if (process.env.NEXT_PUBLIC_TUS_SERVICE_ENDPOINT) {
            console.log("Using TUS server endpoint set from env var")
            return process.env.NEXT_PUBLIC_TUS_SERVICE_ENDPOINT
        }

        if (process.env.NODE_ENV == "development") {
            return "http://localhost:1080/files/";
        }

        console.log("Using default TUS server endpoint");
        return "https://datamap.pcs.usp.br/files/";
    }

    return (
        <div className="datamap-uppy w-full flex flex-col gap-2">
            {formikContext &&
                <ErrorMessage
                    name='remoteFilesCount'
                    component="div"
                    className="text-xs text-error-600"
                />
            }
            <style jsx global>{`
                .datamap-uppy .uppy-Dashboard-inner {
                    background-color: #ffffff;
                    border: 1px dashed #9ca3af;
                    border-radius: 8px;
                    font-family: var(--font-inter), Inter, system-ui, sans-serif;
                }
                .datamap-uppy .uppy-Dashboard-innerWrap {
                    border-radius: 8px;
                }
                .datamap-uppy .uppy-Dashboard-AddFiles {
                    border: 0;
                }
                .datamap-uppy .uppy-Dashboard-AddFiles-title {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    font-size: 15px;
                    line-height: 23px;
                    font-weight: 400;
                    color: #374151;
                }
                .datamap-uppy .uppy-Dashboard-AddFiles-title::before {
                    content: "upload_file";
                    font-family: 'Material Symbols Outlined';
                    font-size: 36px;
                    line-height: 1;
                    color: #6b7280;
                    font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' -25, 'opsz' 40;
                }
                .datamap-uppy .uppy-Dashboard-browse {
                    color: #0b0b0c;
                    font-weight: 600;
                    text-decoration: underline;
                }
                .datamap-uppy .uppy-Dashboard-browse:hover,
                .datamap-uppy .uppy-Dashboard-browse:focus {
                    color: #4b5563;
                    border-bottom: 0;
                }
                .datamap-uppy .uppy-Dashboard-note {
                    font-size: 13px;
                    color: #9ca3af;
                }
            `}</style>
            <Dashboard
                uppy={uppy}
                disabled={false}
                width="100%"
                height={260}
                proudlyDisplayPoweredByUppy={false}
                singleFileFullScreen={false}
                fileManagerSelectionType='both'
                showLinkToFileUploadResult={false}
                showProgressDetails
                doneButtonHandler={() => { }}
                disableStatusBar={false}
                showSelectedFiles={true}
                showRemoveButtonAfterComplete={true}
                hideUploadButton={true}
            />
        </div>
    )
}
