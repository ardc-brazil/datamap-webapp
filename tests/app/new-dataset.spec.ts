import { test } from '@playwright/test';
import { NewDatasetPage } from "./new-dataset.page";
import { SignInPage } from "../public/signin.page";

test('create new dataset', async ({ page }) => {
    const pageObj = new NewDatasetPage(page);
    await pageObj.goto()
    pageObj.assertInstructionTexts();

    // TODO: Add more assertions and fill the form to create a new dataset.
});