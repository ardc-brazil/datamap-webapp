import Uppy, { UploadedUppyFile } from '@uppy/core';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Dashboard } from '@uppy/react';
import Tus from '@uppy/tus';
import { ErrorMessage, useFormikContext } from "formik";
import { useEffect, useState } from 'react';

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
            // Add file to the formik context to validate before submit
            const formikValues = (formikContext.values as FormValues)
            formikValues?.uploadedDataFiles?.push({
                id: file.id,
                name: file.name,
                extension: file.extension,
            })

            formikContext.setFieldValue("remoteFilesCount", formikValues?.uploadedDataFiles?.length, true);
        }).on('file-removed', (file, reason) => {
            if (reason === 'removed-by-user') {
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
        <>
            <ErrorMessage
                name='remoteFilesCount'
                component="div"
                className="text-xs text-error-600"
            />
            <Dashboard
                uppy={uppy}
                disabled={false}
                width={"100wv"}
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
        </>
    )
}
