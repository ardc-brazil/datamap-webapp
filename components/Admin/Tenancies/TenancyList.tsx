import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_COPY } from "../../../contants/AdminConstants";
import { AdminTenancy } from "../../../types/GatekeeperAPI";
import { TenancyIcon } from "../../Tenancy/TenancyIcon";

interface Props {
    tenancies: AdminTenancy[]
    selectedPath: string | null
    onSelect(path: string): void
}

export function TenancyList({ tenancies, selectedPath, onSelect }: Props) {
    const current = tenancies.filter((tenancy) => !tenancy.is_legacy);
    const legacy = tenancies.filter((tenancy) => tenancy.is_legacy);

    return (
        <ul className="m-0 list-none overflow-hidden rounded-lg border border-primary-200 bg-primary-0 p-0">
            {current.map((tenancy) => (
                <TenancyRow key={tenancy.path} tenancy={tenancy} selected={tenancy.path === selectedPath} onSelect={onSelect} />
            ))}
            {legacy.length > 0 && (
                <li className="border-t border-primary-200 bg-primary-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500">{ADMIN_COPY.legacyGroup}</li>
            )}
            {legacy.map((tenancy) => (
                <TenancyRow key={tenancy.path} tenancy={tenancy} selected={tenancy.path === selectedPath} onSelect={onSelect} />
            ))}
        </ul>
    );
}

function TenancyRow({ tenancy, selected, onSelect }: { tenancy: AdminTenancy; selected: boolean; onSelect(path: string): void }) {
    return (
        <li className="border-t border-primary-100 first:border-t-0">
            <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(tenancy.path)}
                className={`flex w-full items-center gap-4 px-4 py-3 text-left ${selected ? "bg-primary-50" : "hover:bg-primary-50"}`}
            >
                <TenancyIcon tenancy={tenancy} />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2 truncate text-sm font-semibold text-primary-900">
                        {tenancy.display_name}
                        {!tenancy.is_enabled && <span className="rounded-full bg-primary-200 px-2 py-px text-[11px] font-semibold text-primary-700">Disabled</span>}
                    </span>
                    <span className="truncate font-mono text-xs text-primary-500">{tenancy.path}</span>
                </span>
                <Count value={tenancy.members} label="members" />
                <Count value={tenancy.datasets} label="datasets" />
                <MaterialSymbol icon={tenancy.is_default ? "lock" : "chevron_right"} size={20} weight={400} grade={-25} className="text-primary-400" />
            </button>
        </li>
    );
}

function Count({ value, label }: { value: number; label: string }) {
    return (
        <span className="flex w-16 flex-none flex-col items-end">
            <span className="text-sm font-semibold text-primary-900">{value}</span>
            <span className="text-[11px] text-primary-500">{label}</span>
        </span>
    );
}
