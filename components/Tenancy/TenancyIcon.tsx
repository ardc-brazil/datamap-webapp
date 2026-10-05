import { MaterialSymbol } from "react-material-symbols";
import { PUBLIC_TENANCY_ICON, TENANCY_ICON } from "../../contants/TenancyConstants";
import { TenancySummary } from "../../types/GatekeeperAPI";

export function TenancyIcon({ tenancy, pending }: { tenancy?: Pick<TenancySummary, "is_default">; pending?: boolean }) {
    const icon = tenancy?.is_default ? PUBLIC_TENANCY_ICON : TENANCY_ICON;
    const frame = pending
        ? "border border-dashed border-primary-400 bg-primary-0 text-primary-500"
        : "bg-secondary-500 text-primary-700";

    return (
        <span
            aria-hidden="true"
            data-icon={icon}
            data-pending={pending ? "true" : undefined}
            className={`flex flex-none items-center justify-center h-8 w-8 rounded-md ${frame}`}
        >
            <MaterialSymbol icon={icon} size={18} weight={400} grade={-25} />
        </span>
    );
}
