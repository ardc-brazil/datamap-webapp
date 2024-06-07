import axios from "axios";
import { UserDetailsResponse } from "../lib/users";
import { CreateDatasetRequestV2, CreateDatasetResponseV2, FileUploadAuthTokenRequest, FileUploadAuthTokenResponse, UpdateDatasetRequest, UpdateDatasetResponse } from "../types/BffAPI";


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
                console.log("Created with success:", response);
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
}