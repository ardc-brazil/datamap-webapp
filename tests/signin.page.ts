
import { faker } from '@faker-js/faker';
import { expect, type Locator, type Page } from '@playwright/test';
import { InternalHomePage } from "./internal-home.page";
import { ProfilePage } from "./profile.page";

export class SignInPage {
  readonly page: Page;
  readonly internalHomePage: InternalHomePage
  readonly profilePage: ProfilePage

  readonly getSignWithOrcidButton: Locator;
  readonly getSignWithGitHubButton: Locator;
  readonly getRegisterButton: Locator;
  readonly getNameInput: Locator;
  readonly getEmailInput: Locator;
  readonly getPasswordInput: Locator;
  readonly getLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.internalHomePage = new InternalHomePage(page)
    this.profilePage = new ProfilePage(page)

    this.getSignWithOrcidButton = page.getByRole('button', { name: 'Sign in with orcid', exact: false });
    this.getSignWithGitHubButton = page.getByRole('button', { name: 'Sign in with github', exact: false });
    this.getNameInput = page.getByPlaceholder('John Doe');
    this.getEmailInput = page.getByPlaceholder('john@email.com');
    this.getPasswordInput = page.getByPlaceholder('********');
    this.getLoginButton = page.getByRole('button', { name: 'Login With Credential', exact: true });
  }

  async goto() {
    await this.page.goto('/account/login?phase=sign-in&tenancy=datamap%2Fproduction%2Fdata-amazon');
  }

  async signIn(): Promise<{ name: string, email: string }> {
    await this.goto()
    return await this.signWithLocalCredentialRandonUser();
  }

  async signinWithOrcidToDatamap() {
    await expect(this.getSignWithOrcidButton).toBeVisible()
  }

  async signinWithGithubToDatamap() {
    await expect(this.getSignWithOrcidButton).toBeVisible()
  }

  async signWithLocalCredentialRandonUser() {
    const name = faker.internet.displayName();
    const email = `${faker.internet.userName()}@local.datamap.com`
    await this.signWithLocalCredential(name, email)
    return { name: name, email: email }
  }

  async signWithLocalCredential(name, email) {
    await expect(this.getNameInput).toBeVisible()
    await this.getNameInput.fill(name)
    await this.getEmailInput.fill(email);
    await this.getPasswordInput.fill('12345678890');
    await this.getLoginButton.click();

    // Check next page
    await this.internalHomePage.assertWelcomeHeaderMessage(name);
  }
}