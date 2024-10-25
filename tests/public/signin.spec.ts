import { test } from '@playwright/test';
import { SignInPage } from "./signin.page";
import { MainMenuPage } from "../app/main-manu.page";
import { ProfilePage } from "../app/profile.page";


test('signing with orcid available', async ({ page, request }) => {
    const pageObj = new SignInPage(page, request);
    await pageObj.goto()
    await pageObj.signinWithOrcidToDatamap()
});

test('signing with github available', async ({ page, request }) => {
    const pageObj = new SignInPage(page, request);
    await pageObj.goto()
    await pageObj.signinWithGithubToDatamap()
});

test('signing with credentials', async ({ page, request}) => {
    const pageObj = new SignInPage(page, request);
    await pageObj.goto()
    const result = await pageObj.signWithLocalCredentialRandonUser()

    const mainMenu = new MainMenuPage(page);
    mainMenu.getProfileMenuItem.click();

    const profilePage = new ProfilePage(page);
    await profilePage.assertName(result.name)
    await profilePage.assertEmail(result.email)
    await profilePage.assertProvider(`credentials - ${result.email}`)
});
