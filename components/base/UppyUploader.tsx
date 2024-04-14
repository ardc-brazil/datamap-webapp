import Uppy from '@uppy/core';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Dashboard } from '@uppy/react';
import Tus from '@uppy/tus';
import { useSession } from "next-auth/react";
import { useState } from 'react';

export default function UppyUploader() {
    const { data: session } = useSession();

    console.log("==============");
    console.log(process.env.TUS_SERVICE_ENDPOINT);
    console.log("==============");

    // IMPORTANT: passing an initializer function to prevent Uppy from being reinstantiated on every render.
    const [uppy] = useState(
        new Uppy({
            debug: false,
            autoProceed: true,
            meta: { "uid": "test1234" },
        }).on('complete', (result) => {
            console.log('Upload result:', result)
        }).on('file-removed', (file, reason) => {
            if (reason === 'removed-by-user') {
                // TODO: Implement call to remove file after uploaded.
            }
        }).use(Tus, {
            endpoint: process.env.TUS_SERVICE_ENDPOINT,
            headers: {
                "X-User-Id": session?.user?.uid,
            }
        })
    );

    // useEffect(() => {
    //     // Adding to global `meta` will add it to every file.
    //     uppy.setOptions({ meta: { "uid": "test1234" } });
    // }, [uppy]);

    return (
        <>
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
