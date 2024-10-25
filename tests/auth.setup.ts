import { test as setup } from '@playwright/test';
import { STORAGE_STATE } from "../playwright.config";
import { SignInPage } from "./public/signin.page";

setup('authenticate', async ({ page, request }) => {
    // Perform authentication steps. Replace these actions with your own.
    const result = await new SignInPage(page, request).signInAsAdmin()
    console.log("Test user authenticated:", result)
    // End of authentication steps.

    // Store cookies to share between tests
    await page.context().addCookies(
        [{
            url: page.url(),
            name: "current_user",
            value: JSON.stringify(result)
        }]
    )
    await page.context().storageState({ path: STORAGE_STATE });
    console.log("Cookies generated and stored at:", STORAGE_STATE);
});