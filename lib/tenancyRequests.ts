import { REQUEST_OUTCOME_VISIBLE_DAYS } from "../contants/TenancyConstants";
import { TenancyRequest } from "../types/GatekeeperAPI";

const DAY_MS = 24 * 60 * 60 * 1000;

export type LatestRequestState =
    | { kind: "pending", request: TenancyRequest }
    | { kind: "declined", request: TenancyRequest }
    | { kind: "approved", request: TenancyRequest }
    | null;

function decidedRecently(request: TenancyRequest, now: Date): boolean {
    if (!request.decided_at) {
        return false;
    }
    return now.getTime() - new Date(request.decided_at).getTime() <= REQUEST_OUTCOME_VISIBLE_DAYS * DAY_MS;
}

export function latestRequestState(requests: TenancyRequest[] | undefined | null, now: Date): LatestRequestState {
    const latest = requests?.[0];
    if (!latest) {
        return null;
    }
    if (latest.status === "pending") {
        return { kind: "pending", request: latest };
    }
    if (latest.status === "declined" && decidedRecently(latest, now)) {
        return { kind: "declined", request: latest };
    }
    if (latest.status === "approved" && latest.tenancy && decidedRecently(latest, now)) {
        return { kind: "approved", request: latest };
    }
    return null;
}

export function approvedTenancyMissingFromSession(state: LatestRequestState, sessionTenancies: string[] | undefined | null): boolean {
    return state?.kind === "approved"
        && !!state.request.tenancy
        && !(sessionTenancies ?? []).includes(state.request.tenancy.path);
}
