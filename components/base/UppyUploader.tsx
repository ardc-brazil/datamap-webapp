import Uppy from '@uppy/core';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Dashboard } from '@uppy/react';
import Tus from '@uppy/tus';
import { useSession } from "next-auth/react";
import { useState } from 'react';

export default function UppyUploader() {
    const { data: session } = useSession();

    // IMPORTANT: passing an initializer function to prevent Uppy from being reinstantiated on every render.
    const [uppy] = useState(() => {

        const instance = new Uppy({
            debug: false,
            autoProceed: true,
            meta: { "uid": "test1234" },

        });

        instance.on('complete', (result) => {
            console.log('Upload result:', result)
        }).on('file-removed', (file, reason) => {
            if (reason === 'removed-by-user') {
                // TODO: Implement call to remove file after uploaded.
            }
        });

        instance.use(Tus, {
            endpoint: process.env.NEXT_PUBLIC_TUS_SERVICE_ENDPOINT,
            headers: {
                "X-User-Id": session?.user?.uid,
            }
        });

        return instance;
    });

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
