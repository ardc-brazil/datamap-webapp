import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_COPY, ADMIN_SEARCH_DEBOUNCE_MS, RequestFilter } from "../../../contants/AdminConstants";
import { revalidateAdminRequests, revalidateAdminTenancies, useAdminCounts, useAdminRequests } from "../../../hooks/UseAdmin";
import { useDebouncedValue } from "../../../hooks/UseDebouncedValue";
import { AdminRequestsQuery } from "../../../lib/adminKeys";
import { isLastPage } from "../../../lib/paging";
import { AdminTenancyRequest, GatekeeperPage, TenancyRequestCounts } from "../../../types/GatekeeperAPI";
import { AdminLoadError } from "../AdminLoadError";
import { AdminPageHeader } from "../AdminPageHeader";
import { DeclineRequestDialog } from "./DeclineRequestDialog";
import { RecentlyClosed } from "./RecentlyClosed";
import { RequestsTable } from "./RequestsTable";
import { ReviewRequestDialog } from "./ReviewRequestDialog";

const FILTERS: { value: RequestFilter; label: string; count(counts: TenancyRequestCounts): number }[] = [
    { value: "open", label: "Open", count: (counts) => counts.open },
    { value: "join", label: "Join existing", count: (counts) => counts.join },
    { value: "new", label: "New tenancy", count: (counts) => counts.new },
    { value: "closed", label: "Closed", count: (counts) => counts.closed },
];

const STATE_BOX = "m-0 mt-4 rounded-lg border border-primary-200 bg-primary-0 px-4 py-10 text-center text-sm text-primary-500";

export function queryFor(filter: RequestFilter, q: string, offset: number): AdminRequestsQuery {
    if (filter === "closed") {
        return { status: "closed", q, offset };
    }
    return { status: "open", ...(filter === "open" ? {} : { kind: filter }), q, offset };
}

export function RequestsView({ now }: { now?: Date }) {
    const router = useRouter();
    const today = now ?? new Date();
    const [filter, setFilter] = useState<RequestFilter>("open");
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const [declining, setDeclining] = useState<AdminTenancyRequest | null>(null);
    const q = useDebouncedValue(search.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
    const { data: counts } = useAdminCounts();
    const { data: page, error, mutate } = useAdminRequests(queryFor(filter, q, offset));
    const reviewing = typeof router.query.request === "string" ? router.query.request : null;
    const closed = filter === "closed";

    useEffect(() => {
        setOffset(0);
    }, [q]);

    function setReviewing(requestId: string | null) {
        const query = { ...router.query };
        delete query.request;
        router.replace({ pathname: router.pathname, query: requestId ? { ...query, request: requestId } : query }, undefined, { shallow: true });
    }

    function chooseFilter(value: RequestFilter) {
        setFilter(value);
        setOffset(0);
    }

    function dismissed(close: () => void) {
        close();
        revalidateAdminRequests();
    }

    function approved() {
        setReviewing(null);
        revalidateAdminRequests();
        revalidateAdminTenancies();
    }

    function startDecline(request: AdminTenancyRequest) {
        if (reviewing) {
            setReviewing(null);
        }
        setDeclining(request);
    }

    function declined() {
        setDeclining(null);
        revalidateAdminRequests();
    }

    return (
        <div className="w-full">
            <AdminPageHeader
                title={ADMIN_COPY.requestsTitle}
                subtitle={counts ? `${counts.open} open · ${counts.join} for existing tenancies, ${counts.new} for new ones` : undefined}
            />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Filter requests" className="flex flex-wrap gap-2">
                    {FILTERS.map((option) => {
                        const active = filter === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => chooseFilter(option.value)}
                                className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ${active
                                    ? "bg-primary-900 text-primary-50"
                                    : "border border-primary-300 bg-primary-0 text-primary-700 hover:bg-primary-100"
                                    }`}
                            >
                                {option.label}
                                {counts && <>{" "}<span className={active ? "text-primary-300" : "text-primary-500"}>{option.count(counts)}</span></>}
                            </button>
                        );
                    })}
                </div>
                <div className="relative w-[300px]">
                    <MaterialSymbol icon="search" size={18} weight={400} grade={-25} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
                    <input
                        type="search"
                        aria-label="Search requests"
                        placeholder={ADMIN_COPY.searchPlaceholder}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="h-9 py-0 pl-9"
                    />
                </div>
            </div>

            <RequestsBody
                page={page}
                error={error}
                closed={closed}
                q={q}
                now={today}
                onRetry={() => mutate()}
                onReview={(request) => setReviewing(request.id)}
                onDecline={startDecline}
            />
            {page && page.total_count > page.limit && <Pager page={page} onOffset={setOffset} />}

            <RecentlyClosed />

            {reviewing && (
                <ReviewRequestDialog requestId={reviewing} now={today} onClose={() => dismissed(() => setReviewing(null))} onApproved={approved} onDecline={startDecline} />
            )}
            {declining && <DeclineRequestDialog request={declining} onCancel={() => dismissed(() => setDeclining(null))} onDeclined={declined} />}
        </div>
    );
}

interface BodyProps {
    page?: GatekeeperPage<AdminTenancyRequest>
    error?: unknown
    closed: boolean
    q: string
    now: Date
    onRetry(): void
    onReview(request: AdminTenancyRequest): void
    onDecline(request: AdminTenancyRequest): void
}

function RequestsBody({ page, error, closed, q, now, onRetry, onReview, onDecline }: BodyProps) {
    if (error) {
        return <div className="mt-4"><AdminLoadError message={ADMIN_COPY.requestsLoadError} onRetry={onRetry} /></div>;
    }
    if (!page) {
        return <p role="status" className={STATE_BOX}>Loading requests…</p>;
    }
    if (page.items.length === 0) {
        const text = q ? `No requests match “${q}”.` : closed ? ADMIN_COPY.closedEmpty : ADMIN_COPY.requestsEmpty;
        return <p className={STATE_BOX}>{text}</p>;
    }
    return <RequestsTable requests={page.items} closed={closed} now={now} onReview={onReview} onDecline={onDecline} />;
}

function Pager({ page, onOffset }: { page: GatekeeperPage<AdminTenancyRequest>; onOffset(offset: number): void }) {
    return (
        <div className="mt-3 flex items-center justify-end gap-3 text-[13px] text-primary-500">
            <span>{`${page.offset + 1}–${page.offset + page.items.length} of ${page.total_count}`}</span>
            <button type="button" disabled={page.offset === 0} onClick={() => onOffset(Math.max(0, page.offset - page.limit))} className="btn-primary-outline btn-small m-0">Previous</button>
            <button type="button" disabled={isLastPage(page)} onClick={() => onOffset(page.offset + page.limit)} className="btn-primary-outline btn-small m-0">Next</button>
        </div>
    );
}
