import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright-report/.auth/user.json');

setup('authenticate', async ({ page }) => {
    // Perform authentication steps. Replace these actions with your own.
    await page.goto('/login');
    await page.getByLabel('Username or email address').fill('username');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('https://github.com/');
    // Alternatively, you can wait until the page reaches a state where all cookies are set.
    await expect(page.getByRole('button', { name: 'View profile and more' })).toBeVisible();

    // End of authentication steps.

    await page.context().storageState({ path: authFile });

    await page.goto('http://localhost:3000/');
    // await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    // await page.getByRole('button', { name: 'GitHub dark icon Sign in with' }).click();
    // await page.getByLabel('Username or email address').click();
    // await page.getByLabel('Username or email address').fill('andrenmaia@gmail.com');
    // await page.getByLabel('Username or email address').press('Tab');
    // await page.getByLabel('Password').click();
    // await page.getByLabel('Password').click();
    // await page.getByLabel('Password').fill('vcd_jzt@pwj0BWN5fau');
    // await page.getByLabel('Password').press('Enter');
    // await page.getByLabel('Password').press('Enter');
    // await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    // await page.goto('http://localhost:3000/');
    // await expect(page.getByRole('heading')).toContainText('Welcome,');
});