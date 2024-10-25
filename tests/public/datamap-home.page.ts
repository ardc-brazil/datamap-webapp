
import { expect, type Locator, type Page } from '@playwright/test';

export class DataMapHomePage {
  readonly page: Page;
  readonly getAboutLink: Locator;
  readonly getSupportLink: Locator;
  readonly getDataPolicy: Locator;
  readonly getResearchGroup: Locator;
  readonly getPartnersAndSupporters: Locator;
  readonly getSignButton: Locator;
  readonly getRegisterButton: Locator;

  readonly titleHeader: Locator;
  readonly SubtitleHeader: Locator;

  constructor(page: Page) {
    this.page = page;

    this.getAboutLink = page.locator('a', { hasText: 'About' });
    this.getSupportLink = page.locator('a', { hasNotText: 'Partners', hasText: 'Support' });
    this.getDataPolicy = page.locator('a', { hasText: 'Data Policy' });
    this.getResearchGroup = page.locator('a', { hasText: 'Research Group' });
    this.getPartnersAndSupporters = page.locator('a', { hasText: 'Partners and Supporters' });

    this.titleHeader = page.locator('h1', { hasText: 'DataMap' });
    this.SubtitleHeader = page.locator('h1', { hasText: 'Scientific data analysis, for everyone.' });

    this.getSignButton = page.getByRole('link', { name: 'Sign in', exact: true });
    this.getRegisterButton = page.getByRole('button', { name: 'Register' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async getHeaders() {
    await expect(this.titleHeader).toBeVisible();
    await expect(this.SubtitleHeader).toBeVisible();
  }

  async getLinks() {
    await expect(this.getAboutLink).toBeVisible()
    await expect(this.getSupportLink).toBeVisible()
    await expect(this.getDataPolicy).toBeVisible()
    await expect(this.getResearchGroup).toBeVisible()
    await expect(this.getPartnersAndSupporters).toBeVisible()
  }

  async assertTitle() {
    await expect(this.page).toHaveTitle(/DataMap/);
  }
}