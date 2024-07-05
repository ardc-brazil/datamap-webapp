import { DatasetInfo } from "./GatekeeperAPI"

export interface CreateDatasetRequest {
    title: string,

    /**
     * @deprecated TODO: use title field instead
     */
    datasetTitle?: string,
    /**
     * @deprecated TODO: use dataset version.
     */
    urls?: Url[]
    /**
     * @deprecated TODO: useless information, remove from the code
     */
    remoteFilesCount?: number
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
    files: GetDatasetDetailsVersionFileResponse[]
}

export interface GetDatasetDetailsVersionFileResponse {
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
    content: GetDatasetsResponse,
    size: number
}

export interface GetDatasetsResponse {
    content: GetDatasetsDetasetDetailsResponse[]
    size: number
}

export interface GetDatasetsDetasetDetailsResponse {
    id: string
    name: string
    design_state: DesignState
    data: DatasetInfo
    created_at: Date
    versions: [
        {
            id: string
            name: string
            design_state: DesignState,
            is_enabled: boolean,
            files: []
        }
    ],
    current_version: {
        id: string
        name: string
        design_state: DesignState,
        is_enabled: boolean,
        files: []
    }
}

export interface CreateDatasetRequestV2 {
    title: string
    dataFiles?: [
        {
            id: string,
            name: string,
            extension: string,
        }
    ]
}

enum DesignState {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED"
}

export interface CreateDatasetResponseV2 {
    id: string
    name: string
    data: DatasetInfo
    design_state: DesignState
    tenancy: string
    versions: [
        {
            id: string
            name: string
            design_state: DesignState,
            is_enabled: boolean,
            files: []
        }
    ],
    current_version: {
        id: string
        name: string
        design_state: DesignState,
        is_enabled: boolean,
        files: []
    }
}

export interface FileUploadAuthTokenRequest {
    file: {
        id: string
    }
}
export interface FileUploadAuthTokenResponse {
    user: {
        id: string
    },
    token: {
        jwt: string
    }
}


export interface UpdateDatasetRequest {
    id: string,
    name: string,
    data: object,
    tenancy: string
    is_enabled: boolean
}

export interface UpdateDatasetResponse {
}