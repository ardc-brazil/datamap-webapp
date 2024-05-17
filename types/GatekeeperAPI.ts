/*
 This the file to declare requests responses from the Gatekeeper API.
*/


/**
 * Represents a request to dataset creation.
 * @interface
 */
export interface CreateDatasetAPIRequest {
    name: string;
    data: any;
    tenancty: string;
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

/**
 * A data file from a dataset.
 */
export interface DataFile {
    path: string,
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
    author: Person,
    contacts: Person[],
    reference: any[],
    dataFiles: DataFile[],
    additional_information: any[],
    level: string,
    resolution: Resolution,
    variables: any[],
    is_enabled: boolean
}

interface Location {
    location: string,
}

interface Person {
    name: string
}

interface Resolution {
    temporal: string,
    spatial: string
}

export interface GetUserDetailsV1Response {
    id: string,
    name: string,
    email: string,
    roles: string[],
    providers: {
        name: string,
        reference: string
    }[],
    is_enabled: boolean,
    created_at: Date,
    updated_at: Date,
    tenancies: string[],
}