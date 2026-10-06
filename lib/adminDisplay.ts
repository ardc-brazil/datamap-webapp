import { WAITING_STALE_DAYS } from "../contants/AdminConstants";
import { AdminTenancyRequest } from "../types/GatekeeperAPI";
import { calendarDaysFromToday } from "./embargoDisplay";

export function daysSince(iso: string, now: Date): number {
    return Math.max(0, -calendarDaysFromToday(iso, now));
}

export function waitingLabel(createdAt: string, now: Date): { text: string; stale: boolean } {
    const days = daysSince(createdAt, now);
    const text = days === 0 ? "today" : days === 1 ? "1 day waiting" : `${days} days waiting`;
    return { text, stale: days >= WAITING_STALE_DAYS };
}

export function requestedAgo(createdAt: string, now: Date): string {
    const days = daysSince(createdAt, now);
    return days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

export function requestTarget(request: AdminTenancyRequest): string {
    return request.suggested_tenancy?.display_name ?? request.requested_name;
}

export function closedOutcome(request: AdminTenancyRequest): { text: string; tone: "approved" | "declined" } {
    if (request.status === "approved") {
        return { text: request.created_tenancy ? "Approved · new tenancy" : "Approved", tone: "approved" };
    }
    return { text: "Declined", tone: "declined" };
}

export function closedTenancyName(request: AdminTenancyRequest): string {
    return request.tenancy?.display_name ?? request.requested_name;
}

export function plural(n: number, one: string, many: string): string {
    return n === 1 ? one : many;
}
