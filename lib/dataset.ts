
import { CreateDatasetRequest, CreateDatasetResponse, DatasetCategoryFiltersResponse, DatasetDetailsResponse, DatasetListResponsePaged, GetDatasetDetailsResponse } from "../types/BffAPI";
import { DataFile, DatasetCreationRequest, DatasetInfo } from "../types/GatekeeperAPI";
import { AppLocalContext } from "./appLocalContext";
import axiosInstance, { buildHeaders } from "./rpc";

function toDatasetInfo(datasetRequest: CreateDatasetRequest): DatasetInfo {
    const dataFiles = datasetRequest?.urls?.map(
        x => ({ path: x.url } as DataFile)
    );

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
        author: null,
        contacts: null,
        reference: [],
        // TODO: deprecate dataFiles, we should always use the data files in version
        dataFiles: dataFiles ?? [],
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

export async function updateDataset(context: AppLocalContext, dataset: any) {
    const ds = {
        name: dataset.name,
        data: dataset?.dataFiles ? dataset : toDatasetInfo({ title: dataset.name }),
        tenancy: context.tenancy,
    };

    const response = await axiosInstance.put("/datasets/" + dataset.id, ds, buildHeaders(context));

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

function hydrateDatasetMetadataInfo(dataset: DatasetDetailsResponse, response: any) {
    dataset.id = response.id;
    dataset.name = response.name;
    dataset.is_enabled = response.is_enabled;
}

function toDatasetDetailsResponse(response: any) {
    return response.data as DatasetDetailsResponse;
}

function toDatasetCategoryFiltersResponse(response: any) {
    return response.data as DatasetCategoryFiltersResponse;
}

export async function getAllDataset(context: AppLocalContext, url: String): Promise<DatasetListResponsePaged> {
    try {

        const urlSplited = url?.split("?");
        var queryString = "";

        if (urlSplited?.length > 0) {
            queryString = urlSplited[1]
        }

        const datasets = [] as DatasetDetailsResponse[];
        return axiosInstance
            .get(`/datasets/?${queryString}`, buildHeaders(context))
            .then(response => {
                const datasetsList = response?.data as DatasetListResponsePaged;

                // Parse data string to json object
                for (const ds of datasetsList.content) {
                    let dataset = toDatasetDetailsResponse(ds);
                    hydrateDatasetMetadataInfo(dataset, ds);
                    datasets.push(dataset);
                }

                datasetsList.content = datasets;

                return datasetsList;
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