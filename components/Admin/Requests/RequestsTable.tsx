import { MaterialSymbol } from "react-material-symbols";
import { ADMIN_OUTCOME_TONE_CLASS } from "../../../contants/AdminConstants";
import useComponentVisible from "../../../hooks/UseComponentVisible";
import { closedOutcome, requestTarget, waitingLabel } from "../../../lib/adminDisplay";
import { formatShortDate } from "../../../lib/embargoDisplay";
import { AdminTenancyRequest, TenancyRequestKind } from "../../../types/GatekeeperAPI";
import { PersonInitial } from "../../Share/PersonInitial";

interface Props {
    requests: AdminTenancyRequest[]
    now: Date
    onReview(request: AdminTenancyRequest): void
    onDecline(request: AdminTenancyRequest): void
}

const GRID = "grid grid-cols-[minmax(0,1fr)_260px_130px_120px_130px] gap-4";

export function RequestsTable(props: Props) {
    return (
        <div role="table" className="mt-4 overflow-hidden rounded-lg border border-primary-200 bg-primary-0">
            <div role="row" className={`${GRID} h-10 items-center bg-primary-50 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500`}>
                <span role="columnheader">Account</span>
                <span role="columnheader">Request</span>
                <span role="columnheader">Requested</span>
                <span role="columnheader">Email</span>
                <span role="columnheader" className="sr-only">Actions</span>
            </div>
            <ul role="rowgroup" className="m-0 list-none p-0">
                {props.requests.map((request) => (
                    <RequestRow key={request.id} request={request} {...props} />
                ))}
            </ul>
        </div>
    );
}

function RequestRow({ request, now, onReview, onDecline }: Omit<Props, "requests"> & { request: AdminTenancyRequest }) {
    const waiting = waitingLabel(request.created_at, now);
    const closed = request.status !== "pending";
    return (
        <li role="row" className={`${GRID} min-h-[64px] items-center border-t border-primary-100 px-4 py-2.5`}>
            <div role="cell" className="flex min-w-0 items-center gap-3">
                <PersonInitial name={request.requester.name} />
                <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-semibold text-primary-900">{request.requester.name}</p>
                    <p className="m-0 truncate text-xs text-primary-500">{request.requester.email ?? "No email"}</p>
                </div>
            </div>
            <div role="cell" className="min-w-0">
                <p className="m-0 flex min-w-0 items-center gap-2 text-sm text-primary-900">
                    <KindPill kind={request.kind} />
                    <span className="truncate">{requestTarget(request)}</span>
                </p>
                <p className="m-0 truncate text-xs text-primary-500" title={request.reason}>{request.reason}</p>
            </div>
            <div role="cell">
                <p className="m-0 text-[13px] text-primary-900">{formatShortDate(request.created_at)}</p>
                {closed
                    ? <p className="m-0 text-xs text-primary-500">{request.decided_at ? `decided ${formatShortDate(request.decided_at, false)}` : ""}</p>
                    : <p className={`m-0 text-xs font-medium ${waiting.stale ? "text-embargo-800" : "text-primary-500"}`}>{waiting.text}</p>}
            </div>
            <div role="cell">
                <EmailState verified={request.requester.email_verified} />
            </div>
            <div role="cell" className="flex items-center justify-end gap-2">
                {closed ? (
                    <ClosedOutcome request={request} />
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => onReview(request)}
                            className="h-8 rounded-md bg-primary-900 px-3 text-[13px] font-semibold text-primary-50 hover:bg-primary-800"
                        >
                            Review
                        </button>
                        <RowMenu name={request.requester.name} onDecline={() => onDecline(request)} />
                    </>
                )}
            </div>
        </li>
    );
}

function KindPill({ kind }: { kind: TenancyRequestKind }) {
    return kind === "join"
        ? <span className="flex-none rounded-full bg-secondary-500 px-2 py-px text-[11px] font-semibold text-primary-900">Join</span>
        : <span className="flex-none rounded-full bg-embargo-100 px-2 py-px text-[11px] font-semibold text-embargo-800">New</span>;
}

function EmailState({ verified }: { verified: boolean }) {
    return verified ? (
        <span className="flex items-center gap-1 text-[13px] text-success-500">
            <MaterialSymbol icon="check_circle" size={16} weight={400} grade={-25} fill />
            verified
        </span>
    ) : (
        <span className="flex items-center gap-1 text-[13px] text-embargo-800">
            <MaterialSymbol icon="cancel" size={16} weight={400} grade={-25} fill />
            unverified
        </span>
    );
}

function ClosedOutcome({ request }: { request: AdminTenancyRequest }) {
    const outcome = closedOutcome(request);
    return (
        <span className={`text-[13px] font-semibold ${ADMIN_OUTCOME_TONE_CLASS[outcome.tone]}`}>{outcome.text}</span>
    );
}

function RowMenu({ name, onDecline }: { name: string; onDecline(): void }) {
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-label={`More actions for ${name}`}
                aria-expanded={isComponentVisible}
                onClick={() => setIsComponentVisible(!isComponentVisible)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-primary-300 bg-primary-0 text-primary-700 hover:bg-primary-100"
            >
                <MaterialSymbol icon="more_horiz" size={18} weight={400} grade={-25} />
            </button>
            {isComponentVisible && (
                <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-primary-200 bg-primary-0 py-1 shadow-lg">
                    <button
                        type="button"
                        onClick={() => {
                            setIsComponentVisible(false);
                            onDecline();
                        }}
                        className="block w-full px-3 py-2 text-left text-[13px] font-semibold text-danger-700 hover:bg-primary-100"
                    >
                        Decline…
                    </button>
                </div>
            )}
        </div>
    );
}
