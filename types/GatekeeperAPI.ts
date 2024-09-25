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
    version: string,
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

export interface DOICreationResponse {
    // TODO: How to mapping error messages in the response?
}

export interface DOIUpdateRequest {
    state: string
    tenancy: string
}

export interface DOIUpdateResponse {
    new_state: string
}