import { test } from '@playwright/test';
import { DataMapHomePage as DatamapHomePage } from "./datamap-home.page";

test('has title', async ({ page }) => {
    const pageObj = new DatamapHomePage(page);
    await pageObj.goto()
    await pageObj.assertTitle()
});

test('has welcome text', async ({ page }) => {
    const pageObj = new DatamapHomePage(page);

    await pageObj.goto()
    await pageObj.getHeaders()
});

test('has main links', async ({ page }) => {
    const pageObj = new DatamapHomePage(page);
    await pageObj.goto()
    await pageObj.getLinks()
});

test('has sign buttons', async ({ page }) => {
    const pageObj = new DatamapHomePage(page);
    await pageObj.goto()
    await pageObj.getSignButton.isVisible()
    await pageObj.getResearchGroup.isVisible()
});

test('navigate to signin', async ({ page }) => {
    const pageObj = new DatamapHomePage(page);
    await pageObj.goto()
    await pageObj.getSignButton.click()
});