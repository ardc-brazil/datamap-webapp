import { useState } from "react";
import { ADMIN_COPY, adminErrorFrom } from "../../../contants/AdminConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useRemovalImpact } from "../../../hooks/UseAdmin";
import { useSubmitOnce } from "../../../hooks/UseSubmitOnce";
import { plural } from "../../../lib/adminDisplay";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { AdminTenancy, RemovalImpact, TenancyMember } from "../../../types/GatekeeperAPI";
import { AdminDialog } from "../AdminDialog";

interface Props {
    tenancy: AdminTenancy
    member: TenancyMember
    onCancel(): void
    onRemoved(): void
}

export function removalBullets(impact: RemovalImpact): string[] {
    const datasets = (n: number) => `${n} ${plural(n, "dataset", "datasets")}`;
    return [
        `Loses access to the ${datasets(impact.datasets_in_tenancy)} of the tenancy`,
        ...(impact.shared_with_user > 0 ? [`Keeps ${datasets(impact.shared_with_user)} shared explicitly`] : []),
        ...(impact.owned_by_user > 0 ? [`Still owns ${datasets(impact.owned_by_user)} of the tenancy`] : []),
        ADMIN_COPY.staysInPublic,
    ];
}

export function RemoveMemberDialog({ tenancy, member, onCancel, onRemoved }: Props) {
    const { data: impact, error: impactError } = useRemovalImpact(tenancy.path, member.id);
    const [error, setError] = useState<string | null>(null);
    const { submit, busy, done } = useSubmitOnce();

    async function remove() {
        setError(null);
        try {
            await submit(async () => {
                await new BFFAPI().removeTenancyMember(tenancy.path, member.id);
                onRemoved();
            });
        } catch (e) {
            setError(adminErrorFrom(e));
        }
    }

    return (
        <AdminDialog
            title={`Remove from ${tenancy.display_name}?`}
            subtitle={`${member.name} · member since ${formatShortDate(impact?.member_since ?? member.since)}`}
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            primary={{ label: "Remove", destructive: true, disabled: busy || done || (!impact && !impactError), onClick: () => { void remove(); } }}
        >
            {impactError ? (
                <p className="m-0 text-[13px] text-primary-500">{ADMIN_COPY.impactLoadError}</p>
            ) : !impact ? (
                <p role="status" className="m-0 text-[13px] text-primary-500">Checking what changes…</p>
            ) : (
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm leading-[21px] text-primary-700">
                    {removalBullets(impact).map((line) => (
                        <li key={line} className="flex gap-2.5"><span className="text-primary-400">—</span><span>{line}</span></li>
                    ))}
                </ul>
            )}
            {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
        </AdminDialog>
    );
}
