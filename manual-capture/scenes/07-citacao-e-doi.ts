import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signInTo } from "./helpers";

export const citacaoEDoi: Scene = {
  id: "07",
  async run({ seed, newPage, shot }) {
    const page = await newPage();
    await signInTo(page, seed.ana, seed.password, seed.workspace.path);
    await page.goto(`${WEBAPP_URL}/app/datasets/${seed.datasets.rascunho}`);
    await page.getByTestId("doi-register-auto").waitFor();
    await shot(page, "doi-registrar", { target: page.getByTestId("dataset-citation") });

    await page.goto(`${WEBAPP_URL}/app/datasets/${seed.datasets.publicado}`);
    await page.getByTestId("dataset-citation").waitFor();
    await shot(page, "doi-publicado", { target: page.getByTestId("dataset-citation"), mask: [page.getByTestId("doi-link")] });

    const anonima = await newPage();
    await anonima.goto(`${WEBAPP_URL}/doi/datasets/${seed.datasets.publicado}/versions/1`);
    await anonima.getByTestId("sign-in-email").waitFor();
    await shot(anonima, "doi-pagina-publica");
  },
};
