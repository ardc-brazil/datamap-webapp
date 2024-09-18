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
    doi: GetDatasetDetailsDOIResponse
}

export interface GetDatasetDetailsDOIResponse {
    id: string
    identifier: string
    status: GetDatasetDetailsDOIResponseState
    registerMode: GetDatasetDetailsDOIResponseRegisterMode
}

/**
 * DOI registration status.
 * More about status, see https://support.datacite.org/docs/what-does-the-state-of-the-doi-mean
 */
export enum GetDatasetDetailsDOIResponseState {
    /**
     * A Draft can be deleted, and they require only the identifier itself in order to be created or saved. 
     * They can be updated to either Registered or Findable DOIs. Registered and Findable DOIs may not be 
     * returned to the Draft state, which means that changing the state of a Draft is final.
     */
    DRAFT = "DRAFT",
    /**
     * Registered DOIs are registered with the global handle system, but they are not indexed in DataCite
     * Commons or the Public API.
     * 
     * Registered and Findable DOIs cannot be deleted.
     */
    REGISTERED = "REGISTERED",
    /**
     * Findable DOIs are registered with the global handle system just like Registered DOIs, but they are 
     * also indexed in DataCite Commons and the Public API.
     * 
     * Registered and Findable DOIs cannot be deleted.
     */
    FINDABLE = "FINDABLE"
}

/**
 * Represents the way that a user can register a DOI to a dataset.
 */
export enum GetDatasetDetailsDOIResponseRegisterMode {
    /**
     * MANUAL means that a user set the identifier an any other information manually.
     * This DOI was not registered by Datamap.
     */
    MANUAL = "MANUAL",

    /**
     * AUTO means that a user request to the platform to register a new DOI automatically.
     * This DOI was registered by Datamap ;)
     */
    AUTO = "AUTO",
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
        files: [],
        doi: {
            id: string
            identifier: string
            status: GetDatasetDetailsDOIResponseState
            mode: GetDatasetDetailsDOIResponseRegisterMode
        }
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


export interface PublishDatasetVersionRequest {
    datasetId: string
    versionName: string
    user_id: string
    tenancies: string[]
}

export interface PublishDatasetVersionResponse {
}

export interface CreateDOIRequest {
    datasetId: string
    versionId: string
    identifier?: string
    registerMode: string
}

export interface CreateDOIResponse {
    id: string
    identifier: string,
    status: string,
    mode: string,
}

export interface ErrorMessage {
    code: string
    message: string
}

export interface DeleteDOIRequest {
    datasetId: string
    versionId: string
}

export interface NavigateDOIStatusRequest {
    datasetId: string
    versionId: string
    status: GetDatasetDetailsDOIResponseState
}