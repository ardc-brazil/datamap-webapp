import { test } from '@playwright/test';
import ListDatasetPage from "./list-dataset.page";


test('list all datasets', async ({ page }) => {
    const pageObj = new ListDatasetPage(page);
    await pageObj.goto()
    pageObj.assertInstructionTexts();

    // TODO: Add more assertions and fill the form to create a new dataset.
});