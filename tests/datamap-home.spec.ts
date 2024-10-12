import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/DataMap/);
});

test('has welcome text', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByRole('main')).toContainText('Scientific data analysis, for everyone.');
    await expect(page.getByRole('main')).toContainText('DataMap');
});

test('has main links', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    await expect(page.getByRole('contentinfo')).toContainText('About');
    await expect(page.getByRole('contentinfo')).toContainText('Support');
    await expect(page.getByRole('contentinfo')).toContainText('Data Policy');
    await expect(page.getByRole('contentinfo')).toContainText('Research Group');
    await expect(page.getByRole('contentinfo')).toContainText('Partners and Supporters');
});