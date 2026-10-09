import { Page } from "@playwright/test";
import { WEBAPP_URL } from "../config";

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${WEBAPP_URL}/account/login?phase=sign-in`);
  await page.getByTestId("sign-in-email").fill(email);
  await page.getByTestId("sign-in-password").fill(password);
  await page.getByTestId("sign-in-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/account"), { timeout: 30_000 });
}

export async function chooseWorkspace(page: Page, path: string): Promise<void> {
  await page.goto(`${WEBAPP_URL}/app/tenancy`);
  await page.getByTestId(`tenancy-option-${path}`).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/app/tenancy"), { timeout: 30_000 });
}

export async function signInTo(page: Page, person: { email: string }, password: string, workspace?: string): Promise<void> {
  await signIn(page, person.email, password);
  if (workspace) {
    await chooseWorkspace(page, workspace);
  }
}
