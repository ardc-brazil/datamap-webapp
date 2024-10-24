import { test } from '@playwright/test';
import { NewDatasetPage } from "./new-dataset.page";
import { SignInPage } from "./signin.page";

test('create new dataset', async ({ page }) => {
    await new SignInPage(page).signIn()
    // TODO: Set permission to the new user
    // The new user should have permission to create a new dataset

    const pageObj = new NewDatasetPage(page);
    await pageObj.goto()
    pageObj.assertInstructionTexts();
    
    // TODO: Add more assertions and fill the form to create a new dataset.
});