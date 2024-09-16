import { CreateDOIRequest, CreateDOIResponse, ErrorMessage } from "../types/BffAPI";
import { AppLocalContext } from "./appLocalContext";


/**
 * Create a new DOI.
 * @param request minimum info to create a new DOI.
 * @returns CreateDOIResponse
 */
export async function createDOI(context: AppLocalContext, req: CreateDOIRequest): Promise<CreateDOIResponse | ErrorMessage> {
    // TODO: implement Gatekeeper API
    // try {
    //     const datasetId = req.datasetId;
    //     const versionId = req.versionId;

    //     const request = {
    //         mode: req.registerMode,
    //         tenancy: context.tenancy,
    //     } as DOICreationRequest;

    //     const response = await axiosInstance.post(
    //         `/datasets/${datasetId}/versions/${versionId}/dois`,
    //         request,
    //         buildHeaders(context)
    //     );

    //     return response.data;
    // } catch (error) {
    //     console.log(error);
    //     return error.response;
    // }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    await sleep(2000);

    // Returning a fake success
    return {
        id: "fake_id",
        identifier: "1000.112/1903234",
        status: "DRAFT",
        mode: req.registerMode,
    }

    // Returning an error
    // return {
    //     code: "234",
    //     message: "Invalid identifier"
    // }
}


/**
 * Delete a new DOI.
 * @param request minimum info to delete a DOI.
 * @returns 
 */
export async function deleteDOI(context: AppLocalContext, doiId: string): Promise<void | ErrorMessage> {
    // TODO: Implement GK integration    
}