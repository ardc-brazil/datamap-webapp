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

export interface GetDatasetDetailsResponse {
    id: string
    name: string
    data: DatasetInfo
    tenancy: string
    is_enabled: boolean
    created_at: Date
    updated_at: Date
    versions: GetDatasetDetailsVersionResponse[]
    current_version: GetDatasetDetailsVersionResponse
}

export interface GetDatasetDetailsVersionResponse {
    id: string
    name: string
    // TODO: convert design_state to Enum
    design_state: string
    is_enabled: boolean
    files: GetDatasetDetailsVersionFilesResponse[]
}

export interface GetDatasetDetailsVersionFilesResponse {
    id: string
    name: string
    size_bytes?: number
    created_at?: Date
    updated_at?: Date
    extension?: string
    format?: string
    storage_file_name?: string
    storage_path?: string
    created_by?: string
}

export interface DatasetDetailsResponse extends DatasetInfo { }

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

