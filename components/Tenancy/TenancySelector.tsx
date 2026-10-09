import { useSession } from "next-auth/react";
import Router from "next/router";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { useSwitchTenancy } from "../../hooks/UseSwitchTenancy";
import { useMyTenancies } from "../../hooks/UseTenancies";
import { firstNameOf, sessionTenanciesDiffer, tenancyPathLabel, tenancySelectionFor } from "../../lib/tenancySelection";
import { useTenancyStore } from "../TenancyStore";
import { AccessPending } from "./AccessPending";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { TenancyIcon } from "./TenancyIcon";
import { TenancyInvitationsPanel } from "./TenancyInvitationsPanel";
import { TenancyRequestRow } from "./TenancyRequestStatus";

export function TenancySelector() {
    const { data: session, update } = useSession();
    const tenancySelected = useTenancyStore((state) => state.tenancySelected);
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected);
    const { data: tenancies, error, isValidating } = useMyTenancies();
    const [requesting, setRequesting] = useState(false);
    const choose = useSwitchTenancy();
    const selection = tenancies ? tenancySelectionFor(tenancies) : null;

    useEffect(() => {
        if (!tenancies || isValidating) {
            return;
        }
        if (sessionTenanciesDiffer(session?.user?.tenancies, tenancies)) {
            update();
        }
        const next = tenancySelectionFor(tenancies);
        if (next.kind === "only") {
            setTenancySelected(next.path);
            Router.replace(ROUTE_PAGE_HOME);
        } else if (tenancySelected && !tenancies.some((tenancy) => tenancy.path === tenancySelected)) {
            setTenancySelected("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenancies, isValidating]);

    const welcome = <h2 className="m-0">Welcome, {firstNameOf(session?.user?.name)}</h2>;

    if (error) {
        return (
            <>
                {welcome}
                <p role="alert" className="mt-2 mb-0 text-sm text-danger-700">Your tenancies could not be loaded. Reload the page to try again.</p>
            </>
        );
    }

    if (!selection || selection.kind === "only") {
        return <p className="m-0 text-sm text-primary-500">Loading your tenancies…</p>;
    }

    return (
        <>
            {welcome}
            {selection.kind === "none" ? (
                <div className="mt-8 flex flex-col gap-4">
                    <TenancyInvitationsPanel />
                    <AccessPending onRequestAccess={() => setRequesting(true)} />
                    <TenancyRequestRow standalone />
                </div>
            ) : (
                <>
                    <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">Choose the tenancy you want to work in.</p>
                    <ul className="mt-8 mb-0 p-0 list-none rounded-lg border border-primary-200 bg-primary-0 divide-y divide-primary-100 overflow-hidden">
                        {tenancies.map((tenancy) => (
                            <li key={tenancy.path}>
                                <button
                                    type="button"
                                    data-testid={`tenancy-option-${tenancy.path}`}
                                    className="group flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-primary-100"
                                    onClick={() => choose(tenancy.path)}
                                >
                                    <TenancyIcon tenancy={tenancy} />
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-[15px] font-semibold text-primary-900">{tenancy.display_name}</span>
                                        <span className="truncate font-mono text-xs text-primary-500">{tenancyPathLabel(tenancy.path)}</span>
                                    </span>
                                    <MaterialSymbol icon="chevron_right" size={20} weight={400} grade={-25} className="flex-none text-primary-400 group-hover:text-primary-900" />
                                </button>
                            </li>
                        ))}
                        <TenancyRequestRow />
                    </ul>
                    <button
                        type="button"
                        className="mt-4 p-0 border-0 bg-transparent text-sm font-semibold text-primary-900 hover:underline underline-offset-2"
                        onClick={() => setRequesting(true)}
                    >
                        + Request access to another tenancy
                    </button>
                </>
            )}
            <RequestAccessDialog show={requesting} onClose={() => setRequesting(false)} />
        </>
    );
}
