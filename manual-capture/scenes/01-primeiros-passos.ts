import { WEBAPP_URL } from "../config";
import { newestCode } from "../gatekeeper";
import { Scene } from "../scene";

const NOME = "Maria Exemplo";
const EMAIL = "maria.exemplo@example.com";
const SENHA = "uma-senha-longa-123";

export const primeirosPassos: Scene = {
  id: "01",
  async run({ newPage, shot }) {
    const page = await newPage();

    await page.goto(`${WEBAPP_URL}/account/login?phase=sign-up`);
    await page.getByTestId("login-tab-sign-up").click();
    await page.getByTestId("sign-up-name").fill(NOME);
    await page.getByTestId("sign-up-email").fill(EMAIL);
    await page.getByTestId("sign-up-password").fill(SENHA);
    await shot(page, "cadastro-formulario");

    await page.getByTestId("sign-up-submit").click();
    await page.getByTestId("code-input").waitFor();
    await shot(page, "cadastro-codigo");

    const code = await newestCode(EMAIL);
    await page.getByTestId("code-input").locator("input").first().click();
    await page.keyboard.type(code);
    await page.waitForURL((url) => !url.pathname.startsWith("/account"), { timeout: 30_000 });

    const entrada = await newPage();
    await entrada.goto(`${WEBAPP_URL}/account/login?phase=sign-in`);
    await entrada.getByTestId("sign-in-email").waitFor();
    await shot(entrada, "entrar-formulario");
  },
};
