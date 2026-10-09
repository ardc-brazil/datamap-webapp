import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signInTo } from "./helpers";

export const suaConta: Scene = {
  id: "02",
  async run({ seed, newPage, shot }) {
    const page = await newPage();
    await signInTo(page, seed.ana, seed.password, seed.workspace.path);
    await page.goto(`${WEBAPP_URL}/app/profile`);
    await page.getByTestId("profile-change-password").waitFor();
    await shot(page, "perfil-visao-geral", { mask: [page.getByText(/^[0-9a-f]{8}-[0-9a-f-]{27}$/)] });
    await shot(page, "perfil-conectar-orcid", { highlight: [page.getByTestId("connect-orcid")], mask: [page.getByText(/^[0-9a-f]{8}-[0-9a-f-]{27}$/)] });

    await page.getByTestId("profile-change-password").click();
    await page.getByTestId("modal").waitFor();
    await shot(page, "perfil-trocar-senha", { target: page.getByTestId("modal") });

    const anonima = await newPage();
    await anonima.goto(`${WEBAPP_URL}/account/forgot-password`);
    await anonima.getByRole("button", { name: "Send link" }).waitFor();
    await shot(anonima, "recuperar-acesso");
  },
};
