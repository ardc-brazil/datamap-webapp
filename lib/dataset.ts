
import axiosInstance from "./rpc";
import { DatasetRequest, DataFile, DatasetInfo } from "../types/GatekeeperAPI";
import { CreateDatasetRequest, CreateDatasetResponse, DatasetDetailsResponse, DatasetListResponsePaged } from "../types/BffAPI";

function toDatasetInfo(datasetRequest: CreateDatasetRequest): DatasetInfo {
    const dataFiles = datasetRequest.urls.map(
        x => ({ path: x.url } as DataFile)
    );

    return {
        id: "",
        name: datasetRequest.datasetTitle,
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
        dataFiles: dataFiles,
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
export async function createDataset(datasetRequest: CreateDatasetRequest): Promise<CreateDatasetResponse> {
    try {
        const request = {
            name: datasetRequest.datasetTitle,
            data: toDatasetInfo(datasetRequest)
        } as DatasetRequest;

        const response = await axiosInstance.post("/datasets", request);

        return response.data;
    } catch (error) {
        return error.response;
    }
}

/**
 * Get a dataset details.
 * @param id dataset id
 * @returns Dataset
 */
export async function getDatasetBy(id: string): Promise<DatasetDetailsResponse> {
    try {
        const response = await axiosInstance.get("/datasets/" + id);
        const dataset = JSON.parse(response.data.data) as DatasetDetailsResponse;
        dataset.id = response.data.id;
        dataset.name = response.data.name;
        dataset.is_enabled = response.data.is_enabled;

        return dataset;

    } catch (error) {
        return error.response;
    }
}

export async function getAllDataset(): Promise<DatasetListResponsePaged> {
    try {
        const response = await axiosInstance.get("/datasets/");

        return {
            content: response.data,
            size: (response.data as [])?.length
        }
    } catch (error) {
        return error.response;
    }
}
