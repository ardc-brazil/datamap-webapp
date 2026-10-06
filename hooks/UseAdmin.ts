import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { ADMIN_COUNTS_REFRESH_MS, ADMIN_PAGE_SIZE } from "../contants/AdminConstants";
import {
    ADMIN_COUNTS_KEY,
    ADMIN_TENANCIES_KEY,
    RECENTLY_CLOSED_KEY,
    adminMembersKey,
    adminRemovalImpactKey,
    adminRequestKey,
    adminRequestsKey,
    adminUsersKey,
    isAdminRequestsKey,
    isAdminTenanciesKey,
} from "../lib/adminKeys";
import { fetcher } from "../lib/fetcher";
import { isLastPage } from "../lib/paging";
import {
    AdminRequestsQuery,
    AdminTenancy,
    AdminTenancyRequest,
    AdminTenancyRequestDetail,
    AdminUserHit,
    GatekeeperPage,
    RemovalImpact,
    TenancyMembers,
    TenancyRequestCounts,
} from "../types/GatekeeperAPI";

export function useAdminCounts(enabled = true) {
    return useSWR<TenancyRequestCounts>(enabled ? ADMIN_COUNTS_KEY : null, fetcher, {
        revalidateOnFocus: true,
        refreshInterval: ADMIN_COUNTS_REFRESH_MS,
    });
}

export function useAdminRequests(query: AdminRequestsQuery) {
    return useSWR<GatekeeperPage<AdminTenancyRequest>>(adminRequestsKey(query), fetcher, { keepPreviousData: true });
}

export function useRecentlyClosed() {
    return useSWR<GatekeeperPage<AdminTenancyRequest>>(RECENTLY_CLOSED_KEY, fetcher);
}

export function useAdminRequest(requestId: string | null) {
    return useSWR<AdminTenancyRequestDetail>(requestId ? adminRequestKey(requestId) : null, fetcher);
}

export function useAdminTenancies() {
    return useSWR<AdminTenancy[]>(ADMIN_TENANCIES_KEY, fetcher);
}

export function useTenancyMembers(path: string | null) {
    return useSWRInfinite<TenancyMembers>(
        (index: number, previous: TenancyMembers | null) => {
            if (!path) {
                return null;
            }
            if (previous && isLastPage(previous.members)) {
                return null;
            }
            return adminMembersKey(path, index * ADMIN_PAGE_SIZE);
        },
        fetcher,
    );
}

export function useRemovalImpact(path: string | null, userId: string | null) {
    return useSWR<RemovalImpact>(path && userId ? adminRemovalImpactKey(path, userId) : null, fetcher);
}

export function useAdminUserSearch(q: string) {
    return useSWR<AdminUserHit[]>(adminUsersKey(q), fetcher);
}

export function revalidateAdminRequests() {
    return mutate(isAdminRequestsKey);
}

export function revalidateAdminTenancies() {
    return mutate(isAdminTenanciesKey);
}
