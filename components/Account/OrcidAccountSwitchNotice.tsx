import { useEffect, useState } from "react";
import { ORCID_ACCOUNT_SWITCHED_MESSAGE, ORCID_CONNECT_UID_STORAGE_KEY } from "../../contants/AccountConstants";

function takeStoredUid(): string | null {
    try {
        const uid = window.sessionStorage.getItem(ORCID_CONNECT_UID_STORAGE_KEY);
        window.sessionStorage.removeItem(ORCID_CONNECT_UID_STORAGE_KEY);
        return uid;
    } catch {
        return null;
    }
}

/** Backs up the server-side link intent: if "Connect ORCID" ever came back signed in to another account, the user is told. */
export function OrcidAccountSwitchNotice(props: { currentUid?: string }) {
    const [switched, setSwitched] = useState(false);

    useEffect(() => {
        if (!props.currentUid) {
            return;
        }
        const startedAs = takeStoredUid();
        setSwitched(Boolean(startedAs) && startedAs !== props.currentUid);
    }, [props.currentUid]);

    if (!switched) {
        return null;
    }
    return (
        <p role="alert" className="m-0 border-b border-primary-100 px-4 py-3 text-sm font-semibold text-danger-700">
            {ORCID_ACCOUNT_SWITCHED_MESSAGE}
        </p>
    );
}
