import { expect, type Locator, type Page } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly getNameText: Locator;
  readonly getEmailText: Locator;
  readonly getProviderText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.getNameText = page.locator("#name")
    this.getEmailText = page.locator("#email")
    this.getProviderText = page.locator("#providers")
  }

  async goto() {
    await this.page.goto('/app/profile');
  }

  async assertName(name: string) {
    await expect(this.getNameText).toContainText(name);
  }

  async assertEmail(email: string) {
    await expect(this.getEmailText).toContainText(email);
  }

  async assertProvider(provider: string) {
    await expect(this.getProviderText).toContainText(provider);
  }
}