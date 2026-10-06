import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useTenancyStore } from "../components/TenancyStore";
import { WORKSPACE_PAGE_SIZE, workspaceInvitationsKey, workspaceMembersKey } from "../contants/TenancyConstants";
import { fetcher } from "../lib/fetcher";
import { isLastPage } from "../lib/paging";
import { membersPageTenancy } from "../lib/tenancySelection";
import { GatekeeperPage, TenancySummary, WorkspaceInvitation, WorkspaceMember } from "../types/GatekeeperAPI";
import { useMyTenancies } from "./UseTenancies";

export function useMembersPageTenancy(): { tenancy: TenancySummary | null; loading: boolean; error?: { status?: number; detail?: string } } {
    const { data, error } = useMyTenancies();
    const selected = useTenancyStore((state) => state.tenancySelected);
    return { tenancy: membersPageTenancy(data, selected), loading: !data && !error, error: data ? undefined : error };
}

export function useWorkspaceMembers(tenancy: string | null) {
    return useSWRInfinite<GatekeeperPage<WorkspaceMember>>(
        (index: number, previous: GatekeeperPage<WorkspaceMember> | null) => {
            if (!tenancy) {
                return null;
            }
            if (previous && isLastPage(previous)) {
                return null;
            }
            return workspaceMembersKey(tenancy, index * WORKSPACE_PAGE_SIZE);
        },
        fetcher,
    );
}

export function useWorkspaceInvitations(tenancy: string | null) {
    return useSWR<WorkspaceInvitation[]>(tenancy ? workspaceInvitationsKey(tenancy) : null, fetcher);
}
