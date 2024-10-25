
import { faker } from '@faker-js/faker';
import { APIRequestContext, expect, type Locator, type Page } from '@playwright/test';
import { InternalHomePage } from "../app/internal-home.page";
import { ProfilePage } from "../app/profile.page";
import { GatekeeperTestAPI } from "../api/gatekeepr.api";

export class SignInPage {
  readonly request: APIRequestContext;
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

  constructor(page: Page, request: APIRequestContext) {
    this.page = page;
    this.request = request;
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

  async signInAsAdmin(): Promise<{ id: string, name: string, email: string }> {
    await this.goto()
    const { email } = await this.signWithLocalCredentialRandonUser();

    const api = new GatekeeperTestAPI(this.request);
    const users = await api.getUser(email)
    const userId = users[0].id

    await api.setRoleAdmin(userId)
    await api.setLocalTestTenancy(userId)

    return users[0]
  }

  async signinWithOrcidToDatamap() {
    await expect(this.getSignWithOrcidButton).toBeVisible()
  }

  async signinWithGithubToDatamap() {
    await expect(this.getSignWithOrcidButton).toBeVisible()
  }

  async signWithLocalCredentialRandonUser() {
    const name = faker.person.fullName();
    const email = `${faker.internet.email().split("@")[0]}@local.datamap.com`
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