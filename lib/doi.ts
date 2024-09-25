import { CreateDOIRequest, CreateDOIResponse, DeleteDOIRequest, ErrorMessage, NavigateDOIStatusRequest } from "../types/BffAPI";
import { DOICreationRequest, DOIUpdateRequest, DOIUpdateResponse } from "../types/GatekeeperAPI";
import { AppLocalContext } from "./appLocalContext";
import axiosInstance, { buildHeaders } from "./rpc";


/**
 * Create a new DOI.
 * @param request minimum info to create a new DOI.
 * @returns CreateDOIResponse
 */
export async function createDOI(context: AppLocalContext, req: CreateDOIRequest): Promise<CreateDOIResponse> {
    const datasetId = req.datasetId;
    const versionId = req.versionId;
    const request = {
        mode: req.registerMode,
        identifier: req.identifier,
        tenancy: context.tenancy,
    } as DOICreationRequest;

    const response = await axiosInstance.post(
        `/datasets/${datasetId}/versions/${versionId}/doi`,
        request,
        buildHeaders(context)
    );

    const result = {
        identifier: response.data?.identifier,
        mode: response.data?.mode?.toString().toLowerCase(),
        state: response.data?.state?.toLowerCase(),
    } as CreateDOIResponse

    return result;
}

/**
 * Delete a new DOI.
 * @param request minimum info to delete a DOI.
 * @returns 
 */
export async function deleteDOI(context: AppLocalContext, req: DeleteDOIRequest): Promise<void> {
    const datasetId = req.datasetId;
    const versionId = req.versionId;

    await axiosInstance.delete(
        `/datasets/${datasetId}/versions/${versionId}/doi`,
        buildHeaders(context)
    );
}

/**
 * Navigate DOI status.
 * @param context app context
 * @param request minimum info to navigate DOI status
 */
export async function navigateDOIToStatus(context: AppLocalContext, req: NavigateDOIStatusRequest): Promise<DOIUpdateResponse | ErrorMessage> {
    const datasetId = req.datasetId;
    const versionId = req.versionId;
    const request = {
        state: req.state
    } as DOIUpdateRequest;

    const response = await axiosInstance.put(
        `/datasets/${datasetId}/versions/${versionId}/doi`,
        request,
        buildHeaders(context)
    );

    const result = {
        new_state: response.data?.new_state
    } as DOIUpdateResponse

    return result;
}