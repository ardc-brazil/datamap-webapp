import Link from "next/link";
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_SHARED } from "../../contants/InternalRoutesConstants";

interface Props {
    active: "tenancy" | "shared"
    tenancyName?: string | null
    tenancyCount?: number
    sharedCount?: number
}

function Tab(props: { href: string, label: string, count?: number, active: boolean }) {
    return (
        <Link
            href={props.href}
            aria-current={props.active ? "page" : undefined}
            className={`pb-3 text-sm font-medium border-b-2 hover:text-primary-900 ${props.active ? "border-primary-900 text-primary-900" : "border-transparent text-primary-500"}`}
        >
            {props.label}{props.count !== undefined && <span className={`ml-1.5 font-normal ${props.active ? "text-primary-500" : "text-primary-400"}`}>{props.count}</span>}
        </Link>
    );
}

export function DatasetsTabs(props: Props) {
    return (
        <nav data-testid="datasets-tabs" className="flex gap-6 border-b border-primary-200" aria-label="Datasets">
            {props.tenancyName &&
                <Tab href={ROUTE_PAGE_DATASETS} label={props.tenancyName} count={props.tenancyCount} active={props.active === "tenancy"} />
            }
            <Tab href={ROUTE_PAGE_DATASETS_SHARED} label="Shared with me" count={props.sharedCount} active={props.active === "shared"} />
        </nav>
    );
}
