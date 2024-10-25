import { expect, type Locator, type Page } from '@playwright/test';
import exp from "constants";

export default class ListDatasetPage {
  readonly page: Page;
  readonly titleHeader: Locator;
  readonly subtitleHeader: Locator;
  readonly instructionText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.titleHeader = page.locator('h2', { hasText: 'Datasets' })
    this.subtitleHeader = page.locator('p', { hasText: 'Explore, analyze, and share quality data. Learn more about' })
  }

  async goto() {
    await this.page.goto('/app/datasets');
  }

  async assertInstructionTexts() {
    await expect(async () => { await this.titleHeader.isVisible() }).toPass()
    await expect(this.titleHeader).toBeVisible({})
    await expect(this.titleHeader).toHaveText('Datasets');
    await expect(this.subtitleHeader).toHaveText('Explore, analyze, and share quality data. Learn more about data types, creating, and collaborating.');
  }
}