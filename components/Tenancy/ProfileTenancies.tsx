import Router from "next/router";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ROUTE_PAGE_TENANCY_SELECTOR } from "../../contants/InternalRoutesConstants";
import { PUBLIC_TENANCY_NOTE } from "../../contants/TenancyConstants";
import { useMyTenancies } from "../../hooks/UseTenancies";
import { useTenancyStore } from "../TenancyStore";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { TenancyIcon } from "./TenancyIcon";
import { TenancyRequestRow } from "./TenancyRequestStatus";

export function ProfileTenancies() {
    const { data: tenancies, error } = useMyTenancies();
    const tenancySelected = useTenancyStore((state) => state.tenancySelected);
    const [requesting, setRequesting] = useState(false);
    const canSwitch = (tenancies?.length ?? 0) > 1;

    return (
        <>
            {error && <p role="alert" className="m-0 px-4 py-3 text-sm text-danger-700">Your tenancies could not be loaded.</p>}
            {!tenancies && !error && <p className="m-0 px-4 py-3 text-sm text-primary-500">Loading…</p>}
            {tenancies &&
                <ul className="m-0 p-0 list-none divide-y divide-primary-100">
                    {tenancies.length === 0 && <li className="px-4 py-3 text-sm italic text-primary-500">You are not in any tenancy yet.</li>}
                    {tenancies.map((tenancy) => (
                        <li key={tenancy.path} className="flex items-center justify-between gap-4 px-4 py-3">
                            <span className="flex items-center gap-3 min-w-0">
                                <TenancyIcon tenancy={tenancy} />
                                <span className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-semibold text-primary-900">{tenancy.display_name}</span>
                                    <span className="truncate font-mono text-xs text-primary-500">{tenancy.path}</span>
                                    {tenancy.is_default && <span className="text-xs text-primary-500">{PUBLIC_TENANCY_NOTE}</span>}
                                </span>
                            </span>
                            {tenancy.path === tenancySelected &&
                                <span className="flex-none px-2.5 py-[3px] rounded-full bg-secondary-500 text-xs font-semibold text-primary-900">Current</span>}
                        </li>
                    ))}
                    <TenancyRequestRow />
                </ul>
            }
            <div className="flex justify-end gap-2 border-t border-primary-100 px-4 py-3">
                <button type="button" className="btn-primary-outline btn-small m-0 flex items-center gap-2" onClick={() => setRequesting(true)}>
                    <MaterialSymbol icon="add" size={18} weight={400} grade={-25} />
                    Request access
                </button>
                {canSwitch &&
                    <button type="button" className="btn-primary-outline btn-small m-0 flex items-center gap-2" onClick={() => Router.push(ROUTE_PAGE_TENANCY_SELECTOR)}>
                        <MaterialSymbol icon="swap_horiz" size={18} weight={400} grade={-25} />
                        Switch tenancy
                    </button>}
            </div>
            <RequestAccessDialog show={requesting} onClose={() => setRequesting(false)} />
        </>
    );
}
