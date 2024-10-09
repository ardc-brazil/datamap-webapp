

// TODO: Move all gatekeeperAPI request to this file

import { AppLocalContext } from "../lib/appLocalContext";
import axiosInstance, { buildHeaders } from "../lib/rpc";
import { CreateDraftDatasetVersionRequest, CreateDraftDatasetVersionResponse, FileDownloadLinkRequest, FileDownloadLinkResponse } from "../types/BffAPI";

/**
 * Gateway client fot Gatekeeper API.
 * This should be used only by the BFF (server side), and never direct by the web app (client side).
 */
export class GatekeeperAPI {

    /**
     * Generates a temporary URL to Download a file.
     * 
     * @param context application context
     * @param req request parameters
     * @returns URL to download a file
     */
    async generateTemporaryFileDownloadLink(context: AppLocalContext, req: FileDownloadLinkRequest): Promise<FileDownloadLinkResponse> {
        const datasetId = req.datasetId;
        const versionName = req.versionName;
        const fileId = req.fileId;

        // TODO: Shouldn't this one be a POST?
        const response = await axiosInstance.get(
            `/datasets/${datasetId}/versions/${versionName}/files/${fileId}`,
            buildHeaders(context)
        );

        // Mapping API response to local response
        const result = {
            url: response.data?.url
        } as FileDownloadLinkResponse

        return result;
    }

    /**
     * Create a dataset version in "draft" state
     * @param context application context
     * @param request request parameters
     * @returns New draft dataset version
     */
    async createDraftDatasetVersion(context: AppLocalContext, request: CreateDraftDatasetVersionRequest): Promise<CreateDraftDatasetVersionResponse> {
        const datasetId = request.datasetId;
        const req = {
            datasetId: request.datasetId,
            datafilesPreviouslyUploaded: request.datafilesPreviouslyUploaded.map(x => x.id)
        };

        const response = await axiosInstance.post(
            `datasets/${datasetId}/versions`,
            req,
            buildHeaders(context)
        );

        // Mapping API response to local response
        const result = response.data as CreateDraftDatasetVersionResponse;

        console.log("version", result);

        // const result = {
        //     id: "new_uuid",
        //     name: "New name mocked",
        //     design_state: "DRAFT",
        //     doi: null,
        //     files: request.datafilesPreviouslyUploaded,
        //     is_enabled: true
        // } as CreateDraftDatasetVersionResponse;

        return result;
    }
}