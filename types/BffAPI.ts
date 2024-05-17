import { DatasetInfo } from "./GatekeeperAPI"

export interface CreateDatasetBFFRequest {
    datasetTitle: string,
    urls: Url[]
    remoteFilesCount: number
}

export interface CreateDatasetResponse {
    id: string
}

export interface Url {
    url: string,
    confirmed: boolean
}

export interface DatasetDetailsResponse extends DatasetInfo { }

export interface GetDatasetDetailsResponse extends DatasetDetailsResponse { }

export interface DatasetCategoryFiltersResponse {
    id: string
    selection: string
    title: string
    options: DatasetCategoryFilterOptionResponse
}

export interface DatasetCategoryFilterOptionResponse {
    id: string,
    label: string,
    value: string,
    type: string
}

export interface DatasetListResponsePaged {
    content: DatasetDetailsResponse[],
    size: number
}