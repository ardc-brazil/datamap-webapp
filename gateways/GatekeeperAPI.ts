

// TODO: Move all gatekeeperAPI request to this file

import { AppLocalContext } from "../lib/appLocalContext";
import { FileDownloadLinkRequest, FileDownloadLinkResponse } from "../types/BffAPI";
import axiosInstance, { buildHeaders } from "../lib/rpc";

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

        const result = {
            url: response.data?.url
        } as FileDownloadLinkResponse

        return result;
    }
}