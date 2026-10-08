import { Page } from "@playwright/test";
import { WEBAPP_URL } from "../config";

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${WEBAPP_URL}/account/login?phase=sign-in`);
  await page.getByTestId("sign-in-email").fill(email);
  await page.getByTestId("sign-in-password").fill(password);
  await page.getByTestId("sign-in-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/account"), { timeout: 30_000 });
}
