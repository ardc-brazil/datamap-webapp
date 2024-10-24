import { test } from '@playwright/test';
import { MainMenuPage } from "./main-manu.page";
import { ProfilePage } from "./profile.page";
import { SignInPage } from "./signin.page";

test('signing with orcid available', async ({ page }) => {
    const pageObj = new SignInPage(page);
    await pageObj.goto()
    await pageObj.signinWithOrcidToDatamap()
});

test('signing with github available', async ({ page }) => {
    const pageObj = new SignInPage(page);
    await pageObj.goto()
    await pageObj.signinWithGithubToDatamap()
});

test('signing with credentials', async ({ page }) => {
    const pageObj = new SignInPage(page);
    await pageObj.goto()
    const result = await pageObj.signWithLocalCredentialRandonUser()

    const mainMenu = new MainMenuPage(page);
    mainMenu.getProfileMenuItem.click();

    const profilePage = new ProfilePage(page);
    await profilePage.assertName(result.name)
    await profilePage.assertEmail(result.email)
    await profilePage.assertProvider(`credentials - ${result.email}`)
});
