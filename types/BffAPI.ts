import { DatasetInfo } from "./GatekeeperAPI"

export interface CreateDatasetRequest {
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

export interface DatasetDetailsResponse extends DatasetInfo {}

export interface DatasetListResponsePaged {
    content: DatasetDetailsResponse[],
    size: number
}

