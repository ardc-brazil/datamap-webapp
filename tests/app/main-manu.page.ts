import { type Locator, type Page } from '@playwright/test';

export class MainMenuPage {
    readonly getProfileMenuItem: Locator;

    constructor(page: Page) {
        this.getProfileMenuItem = page.getByRole('link', { name: 'Profile' });
    }
}