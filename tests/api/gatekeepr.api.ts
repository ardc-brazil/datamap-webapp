import { APIRequestContext, expect } from "@playwright/test";

export class GatekeeperTestAPI {
    readonly baseUrl: string;
    readonly request: APIRequestContext;
    readonly testTenancyName: string;

    constructor(request: APIRequestContext) {
        this.baseUrl = process.env.DATAMAP_BASE_URL;
        this.request = request;
        this.testTenancyName = process.env.PLAYWRIGHT_TEST_TENANCY;
    }

    async getUser(email: string) {
        const userResponse = await this.request.get(`${this.baseUrl}/users?email=${email}`);
        expect(userResponse.ok()).toBeTruthy()
        return userResponse.json()
    }

    async setRoleAdmin(userId: string) {
        const addRoleResponse = await this.request.put(`${this.baseUrl}/users/${userId}/roles`, {
            data: ["admin"]
        })

        expect(addRoleResponse.ok()).toBeTruthy()
    }

    async createTestTenancyIfNotExists() {
        // Create the tenancy if it doesn't exist.
        const responseCreateTenancy = await this.request.post(`${this.baseUrl}/tenancies`, {
            data: {
                "name": this.testTenancyName,
                "is_enabled": true
            }
        })

        // If tenancy already exists, it'll return 409, and that's ok for testing purposes
        // we don't need to create tenancy again once it's already created.
        expect(responseCreateTenancy.status()).toBeGreaterThanOrEqual(200)
        expect(responseCreateTenancy.status()).toBeLessThan(500)
    }

    async setLocalTestTenancy(userId: string) {
        // Create tenancy
        await this.createTestTenancyIfNotExists()

        // Attach user to the tenancy.
        const response = await this.request.post(`${this.baseUrl}/users/${userId}/tenancies`, {
            data: {
                "tenancies": [this.testTenancyName]
            }
        })

        // That's should be a success operation.
        expect(response.ok()).toBeTruthy()
    }
}