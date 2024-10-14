import { test } from '@playwright/test';
import { expect, type Locator, type Page } from '@playwright/test';
import { InternalHomePage } from "./internal-home.page";

import path from 'path';

const authFile = path.join(__dirname, '../playwright-report/.auth/user.json');

test('welcome frase is loaded', async ({ page }) => {

    // context.addCookies([
    //     { name: 'next-auth.callback-url', value: 'http%3A%2F%2Flocalhost%3A3000%2F', path: '/', domain: 'localhost' },
    //     { name: 'next-auth.csrf-token', value: 'cb9fc1d6e7505387b030c2fb3bdc6a8e4d2904f7db5ad1518c9454a30f5c071c%7Cd48eb2b3f7a37f6ca83b36e470d3d9da933f602d6ad9a66f9a1cbe595fdc10ec', path: '/', domain: 'localhost' },
    //     { name: 'next-auth.session-token', value: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..J-gxwpQkJBXZ7FXq.1FynFbZsczW1H9-ugwCAQausZvoyLceXUd-_UpK2z25irqUm_Icz1ACx6tRsYdvfFNJoR8CYjZe3nrfUwZEEOrs4K-z2BJ38aezTRIjcxvVXAtq5IxXXeWHRLa755I3LGldB6OPfE4U4nys9CtEMFhr3W-OTeDW10P7RGUPrrKYSaWHVqAhZEwAyOsReCpQCfXBzRGEbDttALxFug5ZotjvrGUYAHaptX1KEC8AVzPgQYQUmqAEMYKrFADQN0eIpK7n2PFK88AfvufYa0DShyvoqGwTSITDLURV50lRBQxTx4PRbOuah-wga1TcVevCF_zUYFcbfaEi_CkFX_iIDtj6FwMz7onRUf726OjBCBytErbc3bhyBXUTONuG28pvSo199i02dUxu5dRUJQqRhAYGdWycIIvlf4QpfNzFeKn6Sd2RhOFtdQu8_-demZSxLzYSSCsexLyP3DBRnEIKdT5qZtYBdBO2ulw.DaTvQ7NkZoimG083Esjyvw', path: '/', domain: 'localhost' }
    // ])

    await page.context().storageState({ path: authFile });

    const pageObj = new InternalHomePage(page);
    await pageObj.goto()
    await expect(page.getByRole('heading')).toContainText('Welcome,');
    // await pageObj.signinWithOrcidToDatamap()
});