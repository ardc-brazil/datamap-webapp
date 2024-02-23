import { AppLocalContext } from "./appLocalContext";
import axiosInstance, { buildHeaders } from "./rpc";

export interface CreateUserRequest {

    /**
     * Unique name from oAuth provider.
     * @example
     *  - github
     *  - orcid
     */
    providerName: string,

    /**
     * Unique identifier from provider.
     * @example 
     *  - andrenmaia@gmail.com
     *  - cnmaia
     *  - 0000-0002-6356-145X
     */
    providerID: string,

    /**
     * The name of the person, owner of the user.
     * @example 
     *  - André Maia
     *  - Caio Maia
     *  - José Da Silva
     */
    personName: string,

    /**
     * A name that represents the user.
     * @example 
     *  - andremaia
     *  - cnmaia
     *  - 0000-0002-6356-145X
     */
    userName: string,

    /**
     * User email address
     */
    email: string
}

export interface GetUserByProviderRequest {
    providerName: string,
    providerID: string
}

export interface UserDetailsResponse {
    id: string,
    name: string,
    email: string,
    roles: string[],
    providers: ProviderUserDetailsResponse[],
    is_enabled: boolean,
    created_at: Date,
    updated_at: Date,
    tenancies: string[],
}

interface ProviderUserDetailsResponse {
    name: string,
    reference: string
}

export async function createUser(requestParams: CreateUserRequest) {

    if (!requestParams.email || requestParams.email === "") {
        requestParams.email = requestParams.userName + "@fake.mail.com";
    }

    const request = {
        "name": requestParams.personName,
        "email": requestParams.email,
        "roles": [],
        "providers": [
            {
                "name": requestParams.providerName,
                "reference": requestParams.providerID
            }
        ]
    };

    const response = await axiosInstance.post("/users/", request);
    return response.data;
}

export async function getUserByUID(context: AppLocalContext): Promise<UserDetailsResponse> {
    const response = await axiosInstance.get(
        `/users/${context.uid}?is_enabled=true`,
        buildHeaders(context)
    );
    return response.data;
}

export async function getUserByProviderID(request: GetUserByProviderRequest) {
    // TODO: improve error handler
    const response = await axiosInstance.get(`/users/providers/${request.providerName}/${request.providerID}`);
    return response.data;
}

// TODO: Create a generic way to validade this.
export function canEditDataset(user: UserDetailsResponse): boolean {
    // return false;
    return user.roles.indexOf("datasets_editor") >= 0
        || user.roles.indexOf("admin") >= 0;
}