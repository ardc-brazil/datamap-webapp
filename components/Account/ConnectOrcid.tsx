import { signIn } from "next-auth/react";
import { ROUTE_PAGE_PROFILE } from "../../contants/InternalRoutesConstants";

export function ConnectOrcid(props: { accountEmail: string }) {
    return (
        <li data-testid="connect-orcid" className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm">
            <span className="text-primary-500">ORCID</span>
            <span className="min-w-0 text-primary-900">
                Not connected. When asked, confirm <span className="font-semibold">{props.accountEmail}</span> so the iD links to this account.
            </span>
            <button
                type="button"
                className="btn-primary-outline btn-small m-0"
                onClick={() => signIn("orcid", { callbackUrl: ROUTE_PAGE_PROFILE })}
            >
                Connect ORCID
            </button>
        </li>
    );
}
