import {
    AcceptInvitationResponse,
    ClaimInvitationsResponse,
    CreatedAnonymousLink,
    GrantRequest,
    GrantResult,
    InvitationPreview,
    MembersAccessRequest,
    MembersAccessResponse,
    PermissionLevel,
    AnonymousPageResponse,
    SharePermission,
    ShareState,
    ShareUser,
} from "../types/GatekeeperAPI";
import { AppLocalContext } from "./appLocalContext";
import axiosInstance, { buildHeaders } from "./rpc";

export async function searchShareCandidates(context: AppLocalContext, datasetId: string, q: string): Promise<ShareUser[]> {
    const response = await axiosInstance.get(`/datasets/${datasetId}/share/candidates`, {
        ...buildHeaders(context),
        params: { q },
    });
    return response.data as ShareUser[];
}

export async function getShareState(context: AppLocalContext, datasetId: string): Promise<ShareState> {
    const response = await axiosInstance.get(`/datasets/${datasetId}/share`, buildHeaders(context));
    return response.data as ShareState;
}

export async function grantAccess(context: AppLocalContext, datasetId: string, request: GrantRequest): Promise<GrantResult> {
    const response = await axiosInstance.post(`/datasets/${datasetId}/share`, request, buildHeaders(context));
    return response.data as GrantResult;
}

export async function changePermissionLevel(context: AppLocalContext, datasetId: string, userId: string, level: PermissionLevel): Promise<SharePermission> {
    const response = await axiosInstance.put(`/datasets/${datasetId}/share/permissions/${userId}`, { level }, buildHeaders(context));
    return response.data as SharePermission;
}

export async function revokePermission(context: AppLocalContext, datasetId: string, userId: string): Promise<void> {
    await axiosInstance.delete(`/datasets/${datasetId}/share/permissions/${userId}`, buildHeaders(context));
}

export async function revokeInvitation(context: AppLocalContext, datasetId: string, invitationId: string): Promise<void> {
    await axiosInstance.delete(`/datasets/${datasetId}/share/invitations/${invitationId}`, buildHeaders(context));
}

export async function regenerateInvitationLink(context: AppLocalContext, datasetId: string, invitationId: string): Promise<{ link: string }> {
    const response = await axiosInstance.post(`/datasets/${datasetId}/share/invitations/${invitationId}/link`, {}, buildHeaders(context));
    return response.data as { link: string };
}

export async function createAnonymousLink(context: AppLocalContext, datasetId: string, label: string): Promise<CreatedAnonymousLink> {
    const response = await axiosInstance.post(`/datasets/${datasetId}/anonymous-links`, { label }, buildHeaders(context));
    return response.data as CreatedAnonymousLink;
}

export async function revokeAnonymousLink(context: AppLocalContext, datasetId: string, linkId: string): Promise<void> {
    await axiosInstance.delete(`/datasets/${datasetId}/anonymous-links/${linkId}`, buildHeaders(context));
}

export async function getAnonymousPage(token: string): Promise<AnonymousPageResponse> {
    const response = await axiosInstance.get(`/anonymous/${encodeURIComponent(token)}`);
    return response.data as AnonymousPageResponse;
}

export async function acceptInvitation(context: AppLocalContext, token: string): Promise<AcceptInvitationResponse> {
    const response = await axiosInstance.post("/invitations/accept", { token }, { headers: { "X-User-Id": context.uid } });
    return response.data as AcceptInvitationResponse;
}

export async function claimInvitations(uid: string): Promise<ClaimInvitationsResponse> {
    const response = await axiosInstance.post(`/users/${uid}/invitations/claim`, {}, { headers: { "X-User-Id": uid } });
    return response.data as ClaimInvitationsResponse;
}

export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
    const response = await axiosInstance.get(`/invitations/${encodeURIComponent(token)}`);
    return response.data as InvitationPreview;
}

export async function setMembersAccess(context: AppLocalContext, datasetId: string, request: MembersAccessRequest): Promise<MembersAccessResponse> {
    const response = await axiosInstance.put(`/datasets/${datasetId}/members-access`, request, buildHeaders(context));
    return response.data as MembersAccessResponse;
}
