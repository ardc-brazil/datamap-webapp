import axios from "axios";
import { httpErrorHandler } from "../lib/rpc";
import { trackUiEvent } from "../lib/telemetryClient";
import { UserDetailsResponse } from "../lib/users";
import { CreateDatasetRequestV2, CreateDatasetResponseV2, CreateDOIRequest, CreateDOIResponse, CreateDraftDatasetVersionRequest, CreateDraftDatasetVersionResponse, DeleteDOIRequest, FileDownloadLinkRequest, FileDownloadLinkResponse, FileUploadAuthTokenRequest, FileUploadAuthTokenResponse, NavigateDOIStatusRequest, PublishDatasetVersionRequest, PublishDatasetVersionResponse, UpdateDatasetRequest, UpdateDatasetResponse } from "../types/BffAPI";
import {
    AcceptInvitationResponse,
    CreatedAnonymousLink,
    DatasetEmbargo,
    EmbargoModeRequest,
    EmbargoNoteRequest,
    ExtendEmbargoRequest,
    GrantRequest,
    GrantResult,
    MembersAccessRequest,
    MembersAccessResponse,
    PermissionLevel,
    SetEmbargoRequest,
    SharePermission,
    ShareUser,
} from "../types/GatekeeperAPI";


/**
 * Gateway implementation for nextjs BFF.
 */
export class BFFAPI {
    /**
     * Create a new dataset.
     * @param request Dataset creation request
     * @returns Dataset created information.
     */
    async createNewDataset(request: CreateDatasetRequestV2): Promise<CreateDatasetResponseV2> {
        try {
            const response = await axios.post("/api/datasets", request);

            if (response.status == 200) {
                trackUiEvent("dataset_created");
                return response.data as CreateDatasetResponseV2;
            }

            console.log(response);
        }
        catch (error) {
            console.log(error);
        }
        return Promise.reject("Error on create dataset");
    }

    /**
     * Update a existing dataset.
     * @param dataset Dataset update information
     * @returns Dataset updated response
     */
    async updateDataset(dataset: UpdateDatasetRequest): Promise<UpdateDatasetResponse> {
        try {
            const response = await axios.put("/api/datasets/" + dataset.id, dataset)

            if (response.status == 200) {
                // TODO: Review the response because is returning {} (object empty)
                return response.data as UpdateDatasetResponse;
            }

            console.log(response);

        } catch (error) {
            console.log(error);
        }

        return Promise.reject("Error to updateDataset");
    }

    /**
     * Get the current user details
     * @returns UserDetailsResponse
     */
    async getUser(): Promise<UserDetailsResponse> {
        try {
            return (await axios.get("/api/user")).data.user;
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Create a new token for file upload
     * @returns 
     */
    async createUploadFileAuthToken(request: FileUploadAuthTokenRequest): Promise<FileUploadAuthTokenResponse> {
        try {
            const response = await axios.post("/api/auth/token", request);

            if (response.status == 200) {
                return response.data;
            }

            console.log(response);
        }
        catch (error) {
            console.log(error);
            return Promise.reject("Error to create file upload token");
        }

        return Promise.reject("Error to create file upload token");
    }

    /**
     * Publish a dataset version.
     * 
     * @param request api request
     * @returns api response
     */
    async publishDatasetVersion(request: PublishDatasetVersionRequest): Promise<PublishDatasetVersionResponse> {
        try {
            const versionName = request.versionName;
            const response = await axios.put(`/api/versions/${versionName}`, request);

            trackUiEvent("version_published");

            return response.data;
        }
        catch (e) {
            throw httpErrorHandler(e);
        }
    }

    /**
     * Create a new DOI for a specific dataset.
     * @param request api request
     * @returns api response
     */
    async createDOI(request: CreateDOIRequest): Promise<CreateDOIResponse> {
        try {
            const response = await axios.post(`/api/dois/`, request);
            trackUiEvent("doi_created");
            return response.data;
        } catch (e) {
            throw httpErrorHandler(e);
        }
    }

    /**
     * Delete a DOI for a specific dataset.
     * @param request api request
     * @returns api response
     */
    async deleteDOI(request: DeleteDOIRequest): Promise<void> {
        try {
            const response = await axios.delete(`/api/dois/`, { data: request });

            if (response.status == 200) {
                return response.data;
            }

            return Promise.resolve();
        }
        catch (error) {
            throw httpErrorHandler(error);
        }
    }

    /**
     * Navigate DOI to another status
     * @param request api request
     */
    async navigateDOIStatus(request: NavigateDOIStatusRequest) {
        try {
            const response = await axios.put(`/api/dois/`, request);

            if (response.status == 200) {
                return response.data;
            }
        }
        catch (error) {
            throw httpErrorHandler(error);
        }
    }

    /**
     * Get a URL for file download.
     * @param request api request
     * @returns File download link response
     */
    async generateTemporaryFileDownloadLink(request: FileDownloadLinkRequest): Promise<FileDownloadLinkResponse> {
        try {
            trackUiEvent("download_clicked");
            const response = await axios.post(`/api/filesdownload/`, request)
            return response.data;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    /**
     * Create dataset version in draft state
     * @param request api request
     * @returns A new DatasetVersion in draft state
     */
    async createNewDraftDatasetVersion(request: CreateDraftDatasetVersionRequest): Promise<CreateDraftDatasetVersionResponse> {
        try {
            const response = await axios.post(`/api/versions`, request);

            if (response.status == 200) {
                trackUiEvent("version_created");
                return response.data as CreateDraftDatasetVersionResponse;
            }
        }
        catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async setEmbargo(datasetId: string, request: SetEmbargoRequest): Promise<DatasetEmbargo> {
        try {
            const response = await axios.put(`/api/datasets/${datasetId}/embargo`, request);
            trackUiEvent("embargo_set");
            return response.data as DatasetEmbargo;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async extendEmbargo(datasetId: string, request: ExtendEmbargoRequest): Promise<DatasetEmbargo> {
        try {
            const response = await axios.post(`/api/datasets/${datasetId}/embargo/extend`, request);
            trackUiEvent("embargo_extended");
            return response.data as DatasetEmbargo;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async endEmbargo(datasetId: string): Promise<DatasetEmbargo> {
        try {
            const response = await axios.post(`/api/datasets/${datasetId}/embargo/end`, {});
            return response.data as DatasetEmbargo;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async setEmbargoMode(datasetId: string, request: EmbargoModeRequest): Promise<DatasetEmbargo> {
        try {
            const response = await axios.put(`/api/datasets/${datasetId}/embargo/mode`, request);
            return response.data as DatasetEmbargo;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async setEmbargoNote(datasetId: string, request: EmbargoNoteRequest): Promise<DatasetEmbargo> {
        try {
            const response = await axios.put(`/api/datasets/${datasetId}/embargo/note`, request);
            return response.data as DatasetEmbargo;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async setMembersAccess(datasetId: string, request: MembersAccessRequest): Promise<MembersAccessResponse> {
        try {
            const response = await axios.put(`/api/datasets/${datasetId}/members-access`, request);
            trackUiEvent("members_access_changed");
            return response.data as MembersAccessResponse;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async searchShareCandidates(datasetId: string, q: string): Promise<ShareUser[]> {
        try {
            const response = await axios.get(`/api/datasets/${datasetId}/share/candidates?q=${encodeURIComponent(q)}`);
            return response.data as ShareUser[];
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async grantAccess(datasetId: string, request: GrantRequest): Promise<GrantResult> {
        try {
            const response = await axios.post(`/api/datasets/${datasetId}/share`, request);
            trackUiEvent("dataset_shared");
            return response.data as GrantResult;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async changePermissionLevel(datasetId: string, userId: string, level: PermissionLevel): Promise<SharePermission> {
        try {
            const response = await axios.put(`/api/datasets/${datasetId}/share/permissions/${userId}`, { level });
            return response.data as SharePermission;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async revokePermission(datasetId: string, userId: string): Promise<void> {
        try {
            await axios.delete(`/api/datasets/${datasetId}/share/permissions/${userId}`);
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async revokeInvitation(datasetId: string, invitationId: string): Promise<void> {
        try {
            await axios.delete(`/api/datasets/${datasetId}/share/invitations/${invitationId}`);
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async regenerateInvitationLink(datasetId: string, invitationId: string): Promise<{ link: string }> {
        try {
            const response = await axios.post(`/api/datasets/${datasetId}/share/invitations/${invitationId}/link`, {});
            return response.data as { link: string };
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async createAnonymousLink(datasetId: string, label: string): Promise<CreatedAnonymousLink> {
        try {
            const response = await axios.post(`/api/datasets/${datasetId}/anonymous-links`, { label });
            trackUiEvent("anonymous_link_created");
            return response.data as CreatedAnonymousLink;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async revokeAnonymousLink(datasetId: string, linkId: string): Promise<void> {
        try {
            await axios.delete(`/api/datasets/${datasetId}/anonymous-links/${linkId}`);
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
        try {
            const response = await axios.post(`/api/invitations/accept`, { token });
            return response.data as AcceptInvitationResponse;
        } catch (error) {
            throw httpErrorHandler(error);
        }
    }

    async signUp(input: { name: string; email: string; password: string }): Promise<{ challengeId: string }> {
        const response = await axios.post("/api/account/sign-up", input);
        return response.data as { challengeId: string };
    }

    async confirmSignUp(challengeId: string, code: string): Promise<void> {
        await axios.post(`/api/account/sign-up/${encodeURIComponent(challengeId)}/confirm`, { code });
    }

    async resendChallenge(challengeId: string): Promise<void> {
        await axios.post(`/api/account/challenges/${encodeURIComponent(challengeId)}/resend`);
    }

    async requestPasswordReset(email: string): Promise<void> {
        await axios.post("/api/account/password-reset", { email });
    }

    async confirmPasswordReset(token: string, password: string): Promise<void> {
        await axios.post("/api/account/password-reset/confirm", { token, password });
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await axios.put("/api/account/password", { currentPassword, newPassword });
    }
}