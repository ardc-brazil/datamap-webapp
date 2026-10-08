import { signIn } from "next-auth/react";
import { useState } from "react";
import { ORCID_CONNECT_FAILED_MESSAGE, ORCID_CONNECT_UID_STORAGE_KEY } from "../../contants/AccountConstants";
import { ROUTE_PAGE_PROFILE } from "../../contants/InternalRoutesConstants";
import { BFFAPI } from "../../gateways/BFFAPI";

export function ConnectOrcid(props: { accountEmail: string, accountUid: string }) {
    const [connecting, setConnecting] = useState(false);
    const [failed, setFailed] = useState(false);

    async function connect() {
        setConnecting(true);
        setFailed(false);
        try {
            await new BFFAPI().startOrcidConnection();
        } catch {
            setFailed(true);
            setConnecting(false);
            return;
        }
        try {
            window.sessionStorage.setItem(ORCID_CONNECT_UID_STORAGE_KEY, props.accountUid);
        } catch {
            // Storage only backs up the server-side check; connecting must not depend on it.
        }
        await signIn("orcid", { callbackUrl: ROUTE_PAGE_PROFILE });
    }

    return (
        <li data-testid="connect-orcid" className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm">
            <span className="text-primary-500">ORCID</span>
            <span className="min-w-0 text-primary-900">
                Not connected. When asked, confirm <span className="font-semibold">{props.accountEmail}</span> so the iD links to this account.
                {failed && <span role="alert" className="mt-1 block text-error-600">{ORCID_CONNECT_FAILED_MESSAGE}</span>}
            </span>
            <button
                type="button"
                disabled={connecting}
                className="btn-primary-outline btn-small m-0 disabled:opacity-60"
                onClick={connect}
            >
                Connect ORCID
            </button>
        </li>
    );
}
