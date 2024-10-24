import { expect, type Locator, type Page } from '@playwright/test';

export class InternalHomePage {
  readonly page: Page;
  readonly titleHeader: Locator;
  readonly SubtitleHeader: Locator;

  constructor(page: Page) {
    this.page = page;

    this.titleHeader = page.getByRole('heading', { name: 'Welcome,' })
    this.SubtitleHeader = page.getByText('Step into the world of')
  }

  async goto() {
    await this.page.goto('/app/home');
  }

  async assertWelcomeHeaderMessage(name: string) {
    await expect(this.titleHeader).toBeVisible()
    await expect(this.titleHeader).toHaveText(`Welcome, ${name}!`);
    await expect(this.SubtitleHeader).toHaveText(`Step into the world of scientific data analysis with DataMap, where data exploration becomes a breeze.`);
  }
}