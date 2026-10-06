import { TenancyInvitation, TenancyRequest, TenancySummary } from "../types/GatekeeperAPI";
import axiosInstance from "./rpc";

/** Self routes span tenancies, so they carry only the acting user, never a tenancy header. */
export function asUser(uid: string) {
    return { headers: { "X-User-Id": uid } };
}

export async function listMyTenancies(uid: string): Promise<TenancySummary[]> {
    const response = await axiosInstance.get(`/users/${uid}/tenancies`, asUser(uid));
    return response.data as TenancySummary[];
}

export async function listMyTenancyRequests(uid: string): Promise<TenancyRequest[]> {
    const response = await axiosInstance.get(`/users/${uid}/tenancy-requests`, asUser(uid));
    return response.data as TenancyRequest[];
}

export async function createTenancyRequest(uid: string, input: { tenancyName: string; reason: string }): Promise<TenancyRequest> {
    const response = await axiosInstance.post(
        `/users/${uid}/tenancy-requests`,
        { tenancy_name: input.tenancyName, reason: input.reason },
        asUser(uid),
    );
    return response.data as TenancyRequest;
}

export async function withdrawTenancyRequest(uid: string, requestId: string): Promise<void> {
    await axiosInstance.delete(`/users/${uid}/tenancy-requests/${requestId}`, asUser(uid));
}

export async function listMyTenancyInvitations(uid: string): Promise<TenancyInvitation[]> {
    const response = await axiosInstance.get(`/users/${uid}/tenancy-invitations`, asUser(uid));
    return response.data as TenancyInvitation[];
}

export async function acceptTenancyInvitation(uid: string, invitationId: string): Promise<{ tenancy: TenancySummary }> {
    const response = await axiosInstance.post(`/users/${uid}/tenancy-invitations/${invitationId}/accept`, {}, asUser(uid));
    return response.data as { tenancy: TenancySummary };
}

export async function declineTenancyInvitation(uid: string, invitationId: string): Promise<void> {
    await axiosInstance.post(`/users/${uid}/tenancy-invitations/${invitationId}/decline`, {}, asUser(uid));
}
