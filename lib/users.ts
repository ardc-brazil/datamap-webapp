import axiosInstance from "./rpc";

export interface CreateUserRequest {
    providerName: string,
    providerID: string,
    userName: string,
}

export interface GetUserByProviderRequest {
    providerName: string,
    providerID: string
}

export async function createUser(requestParams: CreateUserRequest) {

    // TODO: improve email validation.
    let email = requestParams.userName;
    if (email.indexOf("@") < 0) {
        email = requestParams.userName + "@fake.mail.com";
    }

    const request = {
        "name": requestParams.userName,
        "email": email,
        "roles": ["read"],
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