import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { TENANCIES_KEY, TENANCY_INVITATIONS_KEY, TENANCY_REQUESTS_KEY } from "../contants/TenancyConstants";
import { fetcher } from "../lib/fetcher";
import { approvedTenancyMissingFromSession, latestRequestState } from "../lib/tenancyRequests";
import { TenancyInvitation, TenancyRequest, TenancySummary } from "../types/GatekeeperAPI";

export function useMyTenancies() {
    return useSWR<TenancySummary[]>(TENANCIES_KEY, fetcher);
}

export function useTenancyRequests() {
    return useSWR<TenancyRequest[]>(TENANCY_REQUESTS_KEY, fetcher, { revalidateOnFocus: true });
}

export function useTenancyInvitations() {
    return useSWR<TenancyInvitation[]>(TENANCY_INVITATIONS_KEY, fetcher, { revalidateOnFocus: true });
}

export function useLatestTenancyRequest() {
    const { data, mutate } = useTenancyRequests();
    const { data: session, update } = useSession();
    const state = latestRequestState(data, new Date());
    const missing = approvedTenancyMissingFromSession(state, session?.user?.tenancies);
    const refreshedFor = useRef<string | null>(null);
    const requestId = state?.request.id ?? null;

    useEffect(() => {
        if (missing && requestId && refreshedFor.current !== requestId) {
            refreshedFor.current = requestId;
            update();
        }
    }, [missing, requestId, update]);

    return { state, mutate };
}
