import { Page } from "@playwright/test";
import { GetUserByProviderResponse } from "../../lib/users";


export class CurrentUserPage {
    readonly page: Page;
    user: GetUserByProviderResponse;

    constructor(page: Page) {
        this.page = page;
    }

    async getCurrentUser(): Promise<GetUserByProviderResponse> {
        if (!this.user) {
            const cookies = await this.page.context().cookies()
            const currentUserCookie = cookies.find(x => x.name == "current_user")
            this.user = JSON.parse(currentUserCookie.value) as GetUserByProviderResponse;
        }

        return this.user
    }
}