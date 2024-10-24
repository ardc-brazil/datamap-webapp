import { test } from '@playwright/test';
import { InternalHomePage } from "./internal-home.page";
import { SignInPage } from "./signin.page";

test('welcome phrase is loading after login', async ({ page }) => {
    const result = await new SignInPage(page).signIn()

    const pageObj = new InternalHomePage(page);
    await pageObj.goto()
    pageObj.assertWelcomeHeaderMessage(result.name);
});