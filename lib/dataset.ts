
import { CreateDatasetRequest, CreateDatasetResponse, DatasetCategoryFiltersResponse, GetDatasetDetailsResponse, GetDatasetsResponse, PublishDatasetVersionRequest, PublishDatasetVersionResponse, UpdateDatasetRequest } from "../types/BffAPI";
import { DatasetCreationRequest, DatasetInfo } from "../types/GatekeeperAPI";
import { AppLocalContext } from "./appLocalContext";
import axiosInstance, { buildHeaders } from "./rpc";

function toDatasetInfo(datasetRequest: CreateDatasetRequest): DatasetInfo {
    return {
        id: "",
        name: datasetRequest.datasetTitle ?? datasetRequest?.title ?? "none",
        database: "",
        creation_date: new Date(),
        license: "",
        description: "",
        realm: "",
        version: "",
        project: "",
        source_instrument: "",
        source: "",
        institution: "",
        start_date: new Date(1970, 1, 1),
        end_date: new Date(1970, 1, 1),
        tags: [],
        category: "AEROSOLS",
        data_type: "",
        grid_type: "",
        location: {
            location: "Global",
        },
        // TODO: get this from logged user
        owner: null,
        // TODO: get this from logged user
        authors: null,
        contacts: null,
        colaborators: null,
        reference: [],
        additional_information: [],
        level: "",
        resolution: {
            temporal: "",
            spatial: "",
        },
        variables: [],
        is_enabled: true
    };
}

/**
 * Create a new dataset.
 * @param datasetRequest minimum info to create a dataset
 * @returns CreateDatasetResponse
 */
export async function createDataset(context: AppLocalContext, datasetRequest: CreateDatasetRequest): Promise<CreateDatasetResponse> {
    try {
        const request = {
            name: datasetRequest.datasetTitle ?? datasetRequest?.title,
            data: toDatasetInfo(datasetRequest),
            tenancy: context.tenancy,
        } as DatasetCreationRequest;

        const response = await axiosInstance.post("/datasets", request, buildHeaders(context));

        return response.data;
    } catch (error) {
        console.log(error);
        return error.response;
    }
}

/**
 * Get a dataset details.
 * @param id dataset id
 * @returns Dataset
 */
export async function getDatasetBy(context: AppLocalContext, id: string): Promise<GetDatasetDetailsResponse> {
    try {
        const response = await axiosInstance.get("/datasets/" + id, buildHeaders(context));
        return response.data as GetDatasetDetailsResponse;
    } catch (error) {
        console.log(error);
        // FIX: throw a error or encapsulate
        return error.response;
    }
}

export async function updateDataset(context: AppLocalContext, dataset: UpdateDatasetRequest) {
    const response = await axiosInstance.put("/datasets/" + dataset.id, dataset, buildHeaders(context));
    return response.data;
}

export async function getDatasetCategoryFilters(context: AppLocalContext): Promise<DatasetCategoryFiltersResponse> {

    try {
        const response = await axiosInstance.get("/datasets/filters", buildHeaders(context));
        return toDatasetCategoryFiltersResponse(response);
    } catch (error: any) {
        return Promise.reject(error?.response)
    }
}

function toDatasetCategoryFiltersResponse(response: any) {
    return response.data as DatasetCategoryFiltersResponse;
}

export async function getAllDataset(context: AppLocalContext, url: String): Promise<GetDatasetsResponse> {
    try {

        const urlSplited = url?.split("?");
        var queryString = "";

        if (urlSplited?.length > 0) {
            queryString = urlSplited[1]
        }

        return axiosInstance
            .get(`/datasets/?${queryString}`, buildHeaders(context))
            .then(response => {
                return response?.data as GetDatasetsResponse;
            })
            .catch(error => {
                throw error
            });

    } catch (error) {
        console.log(error);
        return error.response;
    }
}

/**
 * Delete dataset (logical delete --> disable)
 * @param id dataset id
 * @returns Dataset
 */
export async function deleteDataset(context: AppLocalContext, id: string): Promise<void> {
    const response = await axiosInstance.delete("/datasets/" + id, buildHeaders(context));

    if (response.status !== 200) {
        console.log(response);
        return Promise.reject(response);
    }
}

/**
 * Publish a dataset version after created.
 * 
 * @param context App context
 * @param request request info to publish a version
 * @returns Response from published version
 */
export async function publishDatasetVersion(context: AppLocalContext, request: PublishDatasetVersionRequest): Promise<PublishDatasetVersionResponse> {
    try {
        const datasetId = request.datasetId;
        const versionName = request.versionName;
        const response = await axiosInstance.put(
            `datasets/${datasetId}/versions/${versionName}/publish`,
            request,
            buildHeaders(context)
        );

        return response.data as PublishDatasetVersionResponse;
    } catch (error) {
        console.log(error);
    }

    return Promise.reject("Error on publish a databaset version");

}