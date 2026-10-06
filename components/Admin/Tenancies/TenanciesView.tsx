import { useRouter } from "next/router";
import { useState } from "react";
import { ADMIN_COPY, ADMIN_STATE_BOX_CLASS } from "../../../contants/AdminConstants";
import { revalidateAdminRequests, useAdminTenancies } from "../../../hooks/UseAdmin";
import { AdminTenancy } from "../../../types/GatekeeperAPI";
import { AdminLoadError } from "../AdminLoadError";
import { AdminPageHeader } from "../AdminPageHeader";
import { NewTenancyDialog } from "./NewTenancyDialog";
import { TenancyList } from "./TenancyList";
import { TenancyMembersPanel } from "./TenancyMembersPanel";

export function defaultTenancy(tenancies: AdminTenancy[]): AdminTenancy | null {
    return tenancies.find((tenancy) => !tenancy.is_default && !tenancy.is_legacy) ?? tenancies[0] ?? null;
}

export function TenanciesView() {
    const router = useRouter();
    const { data: tenancies, error, mutate } = useAdminTenancies();
    const [creating, setCreating] = useState(false);
    const requested = typeof router.query.tenancy === "string" ? router.query.tenancy : null;
    const selected = tenancies ? tenancies.find((tenancy) => tenancy.path === requested) ?? defaultTenancy(tenancies) : null;

    function select(path: string) {
        router.replace({ pathname: router.pathname, query: { ...router.query, tenancy: path } }, undefined, { shallow: true });
    }

    function created(tenancy: AdminTenancy) {
        setCreating(false);
        mutate((list) => [...(list ?? []).filter((item) => item.path !== tenancy.path), tenancy], { revalidate: true });
        revalidateAdminRequests();
        select(tenancy.path);
    }

    return (
        <div className="w-full">
            <AdminPageHeader
                title={ADMIN_COPY.tenanciesTitle}
                subtitle={tenancies ? (
                    <>
                        {`${tenancies.length} tenancies · root `}<code className="font-mono text-[14px]">datamap</code>{" · everyone is in "}<code className="font-mono text-[14px]">public</code>
                    </>
                ) : undefined}
                action={<button type="button" className="btn-primary m-0" onClick={() => setCreating(true)}>+ New tenancy</button>}
            />
            <div className="mt-8">
                {error ? (
                    <AdminLoadError message={ADMIN_COPY.tenanciesLoadError} onRetry={() => mutate()} />
                ) : !tenancies ? (
                    <p role="status" className={ADMIN_STATE_BOX_CLASS}>Loading tenancies…</p>
                ) : tenancies.length === 0 ? (
                    <p className={ADMIN_STATE_BOX_CLASS}>{ADMIN_COPY.tenanciesEmpty}</p>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                        <TenancyList tenancies={tenancies} selectedPath={selected?.path ?? null} onSelect={select} />
                        {selected && <TenancyMembersPanel key={selected.path} tenancy={selected} />}
                    </div>
                )}
            </div>
            {creating && <NewTenancyDialog onCancel={() => setCreating(false)} onCreated={created} />}
        </div>
    );
}
