import { ADMIN_PAGE_SIZE, ADMIN_USER_SEARCH_MIN_LENGTH, RECENTLY_CLOSED_LIMIT } from "../contants/AdminConstants";
import { AdminRequestsQuery } from "../types/GatekeeperAPI";

export const ADMIN_REQUESTS_PREFIX = "/api/admin/tenancy-requests";
export const ADMIN_COUNTS_KEY = ADMIN_REQUESTS_PREFIX + "/counts";
export const ADMIN_TENANCIES_KEY = "/api/admin/tenancies";

export function adminRequestsKey(query: AdminRequestsQuery): string {
    const params = new URLSearchParams();
    params.set("status", query.status);
    if (query.status === "open" && query.kind) {
        params.set("kind", query.kind);
    }
    const q = query.q?.trim();
    if (q) {
        params.set("q", q);
    }
    params.set("limit", String(query.limit ?? ADMIN_PAGE_SIZE));
    params.set("offset", String(query.offset ?? 0));
    return `${ADMIN_REQUESTS_PREFIX}?${params.toString()}`;
}

export const RECENTLY_CLOSED_KEY = adminRequestsKey({ status: "closed", limit: RECENTLY_CLOSED_LIMIT, offset: 0 });

export function adminRequestKey(requestId: string): string {
    return `${ADMIN_REQUESTS_PREFIX}/${encodeURIComponent(requestId)}`;
}

export function adminMembersKey(path: string, offset: number): string {
    return `${ADMIN_TENANCIES_KEY}/members?tenancy=${encodeURIComponent(path)}&limit=${ADMIN_PAGE_SIZE}&offset=${offset}`;
}

export function adminRemovalImpactKey(path: string, userId: string): string {
    return `${ADMIN_TENANCIES_KEY}/members/${encodeURIComponent(userId)}?tenancy=${encodeURIComponent(path)}`;
}

export function adminUsersKey(q: string): string | null {
    const value = q.trim();
    return value.length >= ADMIN_USER_SEARCH_MIN_LENGTH ? `/api/admin/users?q=${encodeURIComponent(value)}` : null;
}

export function isAdminRequestsKey(key: unknown): boolean {
    return typeof key === "string" && key.startsWith(ADMIN_REQUESTS_PREFIX);
}

export function isAdminTenanciesKey(key: unknown): boolean {
    return typeof key === "string" && key.startsWith(ADMIN_TENANCIES_KEY);
}
