import { AppLocalContext } from "../lib/appLocalContext";
import axiosInstance, { buildHeaders } from "../lib/rpc";
import { DatasetDetailsResponse, GetDatasetDetailsResponse } from "../types/BffAPI";
import { GetUserDetailsV1Response } from "../types/GatekeeperAPI";

export class GatekeeperAPI {
    
    /**
     * Get a dataset details.
     * @param id dataset id
     * @returns Dataset
     */
    async getDatasetBy(context: AppLocalContext, id: string): Promise<GetDatasetDetailsResponse> {
        try {
            const response = await axiosInstance.get("/datasets/" + id, buildHeaders(context));

            // TODO: Model response intreface correctly.
            // const dataset = toDatasetDetailsResponse(response.data);
            const dataset = response?.data?.data as DatasetDetailsResponse;
            hydrateDatasetMetadataInfo(dataset, response.data);
            return dataset;

        } catch (error) {
            // FIX: throw a error or encapsulate
            console.log(error)
            return error.response;
        }
    }

    /**
     * Get a User details
     * @param context client context
     * @returns User data response
     */
    async getUserByUID(context: AppLocalContext): Promise<GetUserDetailsV1Response> {
        const response = await axiosInstance.get(
            `/users/${context.uid}?is_enabled=true`,
            buildHeaders(context)
        );
        return response.data;
    }
}


function toDatasetDetailsResponse(response: any) {
    return JSON.parse(response.data) as DatasetDetailsResponse;
}

function hydrateDatasetMetadataInfo(dataset: DatasetDetailsResponse, response: any) {
    dataset.id = response.id;
    dataset.name = response.name;
    dataset.is_enabled = response.is_enabled;
}

