import {
    AdminTenancy,
    AdminTenancyRequest,
    AdminTenancyRequestDetail,
    AdminUserHit,
    GatekeeperPage,
    RemovalImpact,
    TenancyDecision,
    TenancyMember,
    TenancyMembers,
    TenancyRequestCounts,
} from "../types/GatekeeperAPI";
import axiosInstance from "./rpc";
import { asUser } from "./tenancies";

export type TenancyRequestsQuery = { status: "open" | "closed"; kind?: "join" | "new"; q?: string; limit?: number; offset?: number };

export async function getTenancyRequestCounts(uid: string): Promise<TenancyRequestCounts> {
    const response = await axiosInstance.get("/admin/tenancy-requests/counts", asUser(uid));
    return response.data as TenancyRequestCounts;
}

export async function listTenancyRequests(uid: string, query: TenancyRequestsQuery): Promise<GatekeeperPage<AdminTenancyRequest>> {
    const response = await axiosInstance.get("/admin/tenancy-requests", { ...asUser(uid), params: query });
    return response.data as GatekeeperPage<AdminTenancyRequest>;
}

export async function getTenancyRequest(uid: string, requestId: string): Promise<AdminTenancyRequestDetail> {
    const response = await axiosInstance.get(`/admin/tenancy-requests/${requestId}`, asUser(uid));
    return response.data as AdminTenancyRequestDetail;
}

export async function approveTenancyRequest(uid: string, requestId: string, decision: TenancyDecision): Promise<AdminTenancyRequest> {
    const body = "tenancy" in decision
        ? { tenancy: decision.tenancy }
        : { new_tenancy: { display_name: decision.newTenancy.displayName, namespace: decision.newTenancy.namespace } };
    const response = await axiosInstance.post(`/admin/tenancy-requests/${requestId}/approve`, body, asUser(uid));
    return response.data as AdminTenancyRequest;
}

export async function declineTenancyRequest(uid: string, requestId: string, message?: string): Promise<AdminTenancyRequest> {
    const response = await axiosInstance.post(`/admin/tenancy-requests/${requestId}/decline`, { message: message ?? null }, asUser(uid));
    return response.data as AdminTenancyRequest;
}

export async function listAdminTenancies(uid: string): Promise<AdminTenancy[]> {
    const response = await axiosInstance.get("/admin/tenancies", asUser(uid));
    return response.data as AdminTenancy[];
}

export async function createTenancy(uid: string, input: { displayName: string; namespace: string }): Promise<AdminTenancy> {
    const response = await axiosInstance.post("/admin/tenancies", { display_name: input.displayName, namespace: input.namespace }, asUser(uid));
    return response.data as AdminTenancy;
}

export async function listTenancyMembers(uid: string, tenancy: string, page: { limit: number; offset: number }): Promise<TenancyMembers> {
    const response = await axiosInstance.get(`/admin/tenancies/${tenancy}/members`, { ...asUser(uid), params: { limit: page.limit, offset: page.offset } });
    return response.data as TenancyMembers;
}

export async function getMemberRemovalImpact(uid: string, tenancy: string, userId: string): Promise<RemovalImpact> {
    const response = await axiosInstance.get(`/admin/tenancies/${tenancy}/members/${userId}`, asUser(uid));
    return response.data as RemovalImpact;
}

export async function addTenancyMember(uid: string, tenancy: string, userId: string): Promise<TenancyMember> {
    const response = await axiosInstance.post(`/admin/tenancies/${tenancy}/members`, { user_id: userId }, asUser(uid));
    return response.data as TenancyMember;
}

export async function removeTenancyMember(uid: string, tenancy: string, userId: string): Promise<void> {
    await axiosInstance.delete(`/admin/tenancies/${tenancy}/members/${userId}`, asUser(uid));
}

export async function withdrawTenancyInvitationAsAdmin(uid: string, invitationId: string): Promise<void> {
    await axiosInstance.delete(`/admin/tenancy-invitations/${invitationId}`, asUser(uid));
}

export async function searchAdminUsers(uid: string, q: string): Promise<AdminUserHit[]> {
    const response = await axiosInstance.get("/admin/users", { ...asUser(uid), params: { q } });
    return response.data as AdminUserHit[];
}
