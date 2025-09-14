/*
 This the file to declare requests responses from the Gatekeeper API.
*/

/**
 * Represents a request to dataset creation.
 * @interface
 */
export interface DatasetCreationRequest {
    name: string
    data: any
    tenancy: string
}

/**
 * Represents a response from a dataset creation.
 * @interface
 */
export interface DatasetResponse {
    id: string;
    name: string;
    data: string;
    is_enabled: boolean
}

export interface DatasetInfo {
    id: string,
    name: string,
    database: string,
    creation_date: Date,
    license: string,
    description: string,
    realm: string,
    project: string,
    source_instrument: string,
    source: string,
    institution: string,
    start_date: Date,
    end_date: Date,
    tags: string[],
    category: string,
    data_type: string,
    grid_type: string,
    location: Location,
    owner: Person
    authors: Person[],
    contacts: Person[],
    colaborators: {
        name: string
        permission: string
    }[],
    reference: any[],
    additional_information: any[],
    level: string,
    resolution: Resolution,
    variables: any[],
    is_enabled: boolean
    citation?: {
        doi?: string
    }
    references?: string
}

interface Location {
    location: string,
    latitude?: string
    longitude?: string
}

interface Person {
    name: string
}

interface Resolution {
    temporal: string,
    spatial: string
}

export interface DOICreationRequest {
    mode: string
    tenancy: string
}

export interface DOIUpdateRequest {
    state: string
    tenancy: string
}

export interface DOIUpdateResponse {
    new_state: string
}

/**
 * Represents a response for dataset snapshot data.
 * @interface
 */
export interface DatasetSnapshotResponse {
    name: string
    dataset_id: string
    version_name: string
    doi_identifier: string
    doi_link: string
    doi_state: string
    publication_date: string
    files_summary: {
        total_files: number
        total_size_bytes: number
        extensions_breakdown: {
            extension: string
            count: number
            total_size_bytes: number
        }[]
    }
    versions: DatasetSnapshotResponseVersion[]
    data: {
        id: string
        description: string
        tags: string[]
        level: string
        owner: Person | null
        realm: string
        source: string
        authors: Person[]
        license: string
        project: string
        category: string
        contacts: Person[] | null
        database: string
        end_date: string
        location: Location
        data_type: string
        grid_type: string
        reference: any[]
        variables: any[]
        is_enabled: boolean
        resolution: Resolution
        start_date: string
        institution: string
        colaborators: {
            name: string
            permission: string
        }[] | null
        creation_date: string
        source_instrument: string
        additional_information: any[]
    }
}

export interface DatasetSnapshotResponseVersion {
    id: string
    name: string
    doi_identifier: string
    doi_state: string
    created_at: string
}
