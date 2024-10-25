import { test } from '@playwright/test';
import { DataMapHomePage as DatamapHomePage } from "./datamap-home.page";

test.describe.serial('DatamapHomePage', () => {
    let page;
    let pageObj;

    test.beforeAll(async ({ browser }) => {
        // Necessary to avoid share the cookies from other sessions
        // and navigate automatically to the logged area.
        page = await browser.newPage();
        page.context().clearCookies();

        pageObj = new DatamapHomePage(page);
    });

    test('has title', async () => {
        await pageObj.goto()
        await pageObj.assertTitle()
    });

    test('has welcome text', async () => {
        await pageObj.goto()
        await pageObj.getHeaders()
    });

    test('has main links', async () => {
        await pageObj.goto()
        await pageObj.getLinks()
    });

    test('has sign buttons', async () => {
        await pageObj.goto()
        await pageObj.getSignButton.isVisible()
        await pageObj.getResearchGroup.isVisible()
    });

    test('navigate to signin', async () => {
        await pageObj.goto()
        await pageObj.getSignButton.click()
    })

})