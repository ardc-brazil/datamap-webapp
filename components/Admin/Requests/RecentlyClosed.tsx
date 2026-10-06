import Link from "next/link";
import { ADMIN_COPY, ADMIN_OUTCOME_TONE_CLASS } from "../../../contants/AdminConstants";
import { ROUTE_PAGE_ADMIN_ACTIVITY } from "../../../contants/InternalRoutesConstants";
import { useRecentlyClosed } from "../../../hooks/UseAdmin";
import { closedOutcome, closedTenancyName } from "../../../lib/adminDisplay";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { AdminTenancyRequest } from "../../../types/GatekeeperAPI";

export function RecentlyClosed() {
    const { data, error } = useRecentlyClosed();

    return (
        <section className="mt-10" aria-labelledby="recently-closed">
            <div className="flex items-center justify-between">
                <h3 id="recently-closed" className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500">{ADMIN_COPY.recentlyClosed}</h3>
                <Link href={ROUTE_PAGE_ADMIN_ACTIVITY} className="text-[13px] font-semibold text-primary-900">{ADMIN_COPY.activityLink}</Link>
            </div>
            {error ? (
                <p className="m-0 mt-3 text-[13px] text-danger-700">{ADMIN_COPY.recentlyClosedLoadError}</p>
            ) : !data ? (
                <p role="status" className="m-0 mt-3 text-[13px] text-primary-500">Loading…</p>
            ) : data.items.length === 0 ? (
                <p className="m-0 mt-3 text-[13px] text-primary-500">{ADMIN_COPY.closedEmpty}</p>
            ) : (
                <ul className="m-0 mt-2 list-none p-0">
                    {data.items.map((request) => <ClosedRow key={request.id} request={request} />)}
                </ul>
            )}
        </section>
    );
}

function ClosedRow({ request }: { request: AdminTenancyRequest }) {
    const outcome = closedOutcome(request);
    return (
        <li className="flex items-center justify-between gap-4 border-t border-primary-100 py-2.5 text-[13px]">
            <span className="min-w-0 truncate text-primary-700">
                <span className="font-semibold text-primary-900">{request.requester.name}</span>
                {` · ${closedTenancyName(request)} · `}
                <span className={ADMIN_OUTCOME_TONE_CLASS[outcome.tone]}>{outcome.text}</span>
            </span>
            <span className="flex-none text-xs text-primary-500">
                {`by ${request.decided_by?.name ?? "an administrator"} · ${request.decided_at ? formatShortDate(request.decided_at, false) : ""}`}
            </span>
        </li>
    );
}
