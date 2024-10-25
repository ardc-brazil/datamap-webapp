import { expect, type Locator, type Page } from '@playwright/test';

export class NewDatasetPage {
  readonly page: Page;
  readonly titleHeader: Locator;
  readonly subtitleHeader: Locator;
  readonly instructionText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.titleHeader = page.getByRole('heading', { name: 'New Dataset' })
    this.subtitleHeader = page.getByText('Create a new dataset')
    this.instructionText = page.getByText('A dataset refers to a')
  }

  async goto() {
    await this.page.goto('/app/datasets/new');
  }

  async assertInstructionTexts() {
    await expect(async () => { await this.titleHeader.isVisible() }).toPass()
    
    await expect(this.titleHeader).toBeVisible()
    await expect(this.titleHeader).toHaveText('New Dataset');
    await expect(this.subtitleHeader).toHaveText('Create a new dataset informing a title and remote data files.');
    await expect(this.instructionText).toHaveText('A dataset refers to a collection of data that is organized and structured for a specific purpose. It can consist of various types of information such as text, numbers, images, audio, or video.');
  }
}