import axios from "axios";
import { httpErrorHandler } from "../lib/rpc";
import { UserDetailsResponse } from "../lib/users";
import { CreateDatasetRequestV2, CreateDatasetResponseV2, CreateDOIRequest, CreateDOIResponse, DeleteDOIRequest, FileUploadAuthTokenRequest, FileUploadAuthTokenResponse, NavigateDOIStatusRequest, PublishDatasetVersionRequest, PublishDatasetVersionResponse, UpdateDatasetRequest, UpdateDatasetResponse } from "../types/BffAPI";


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

            if (response.status == 200) {
                return response.data;
            }

            console.log(response);
        }
        catch (error) {
            console.log(error);
        }

        return Promise.reject("Error to publish a dataset version");
    }

    /**
     * Create a new DOI for a specific dataset.
     * @param request api request
     * @returns api response
     */
    async createDOI(request: CreateDOIRequest): Promise<CreateDOIResponse> {
        try {
            const response = await axios.post(`/api/dois/`, request);
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
}