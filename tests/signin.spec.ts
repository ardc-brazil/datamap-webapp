import { test } from '@playwright/test';
import { SignInPage } from "./signin.page";

test('signing with orcid', async ({ page }) => {
    const pageObj = new SignInPage(page);
    await pageObj.goto()
    await pageObj.signinWithOrcidToDatamap()
});

test('signing with github', async ({ page }) => {
    const pageObj = new SignInPage(page);
    await pageObj.goto()
    await pageObj.signinWithGithubToDatamap()
});
