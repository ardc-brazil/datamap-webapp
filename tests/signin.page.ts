
import { expect, type Locator, type Page } from '@playwright/test';

export class SignInPage {
  readonly page: Page;
  readonly getSignWithOrcidButton: Locator;
  readonly getSignWithGitHubButton: Locator;
  readonly getRegisterButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.getSignWithOrcidButton = page.getByRole('button', { name: 'Sign in with orcid', exact: false });
    this.getSignWithGitHubButton = page.getByRole('button', { name: 'Sign in with github', exact: false });
  }

  async goto() {
    await this.page.goto('/account/login?phase=sign-in&tenancy=datamap%2Fproduction%2Fdata-amazon');
  }

  async signinWithOrcidToDatamap() {
    await expect(this.getSignWithOrcidButton).toBeVisible()
  }

  async signinWithGithubToDatamap() {
    await expect(this.getSignWithOrcidButton).toBeVisible()
    await this.getSignWithGitHubButton.click()
  }
  
}