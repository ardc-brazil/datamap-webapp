import { GatekeeperPage, InviteeLookup, WorkspaceInvitation, WorkspaceMember } from "../types/GatekeeperAPI";
import axiosInstance from "./rpc";
import { asUser } from "./tenancies";

function workspaceRoute(uid: string, tenancy: string, rest: string): string {
    return `/users/${uid}/tenancies/${tenancy}/${rest}`;
}

export async function listWorkspaceMembers(uid: string, tenancy: string, page: { limit: number; offset: number }): Promise<GatekeeperPage<WorkspaceMember>> {
    const response = await axiosInstance.get(workspaceRoute(uid, tenancy, "members"), { ...asUser(uid), params: { limit: page.limit, offset: page.offset } });
    return response.data as GatekeeperPage<WorkspaceMember>;
}

export async function listWorkspaceInvitations(uid: string, tenancy: string): Promise<WorkspaceInvitation[]> {
    const response = await axiosInstance.get(workspaceRoute(uid, tenancy, "invitations"), asUser(uid));
    return response.data as WorkspaceInvitation[];
}

export async function inviteToWorkspace(uid: string, tenancy: string, userId: string): Promise<WorkspaceInvitation> {
    const response = await axiosInstance.post(workspaceRoute(uid, tenancy, "invitations"), { user_id: userId }, asUser(uid));
    return response.data as WorkspaceInvitation;
}

export async function withdrawWorkspaceInvitation(uid: string, tenancy: string, invitationId: string): Promise<void> {
    await axiosInstance.delete(workspaceRoute(uid, tenancy, `invitations/${invitationId}`), asUser(uid));
}

export async function lookupInvitee(uid: string, tenancy: string, value: string): Promise<InviteeLookup> {
    const response = await axiosInstance.get(workspaceRoute(uid, tenancy, "lookup"), { ...asUser(uid), params: { value } });
    return response.data as InviteeLookup;
}
