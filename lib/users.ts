import axiosInstance from "./rpc";

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

export async function createUser(requestParams: CreateUserRequest) {
    
    if (!requestParams.email || requestParams.email === "") {
        requestParams.email = requestParams.userName + "@fake.mail.com";
    }

    const request = {
        "name": requestParams.personName,
        "email": requestParams.email,
        "roles": ["datasets_read", "users_read"],
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

export async function getUserByUID(uid: string) {
    return {
        providerId: "provider_id",
        uid: "0cbb9610-4b81-44f0-8d1b-0da1fb4a4da7",
        created_at: new Date()
    };
}

export async function getUserByProviderID(request: GetUserByProviderRequest) {
    // TODO: improve error handler
    const response = await axiosInstance.get(`/users/providers/${request.providerName}/${request.providerID}`);
    return response.data;
}