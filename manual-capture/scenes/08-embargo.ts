import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signInTo } from "./helpers";

export const embargo: Scene = {
  id: "08",
  async run({ seed, newPage, shot }) {
    const page = await newPage();
    await signInTo(page, seed.ana, seed.password, seed.workspace.path);

    await page.goto(`${WEBAPP_URL}/app/datasets/${seed.datasets.rascunho}`);
    await page.getByTestId("dataset-tab-settings").click();
    await page.getByTestId("embargo-set").click();
    await page.getByTestId("modal").waitFor();
    await shot(page, "embargo-definir", { target: page.getByTestId("modal") });

    await page.goto(`${WEBAPP_URL}/app/datasets/${seed.datasets.embargo}`);
    await page.getByTestId("embargo-card").waitFor();
    await shot(page, "embargo-cartao", { target: page.getByTestId("embargo-card") });

    await page.getByTestId("dataset-tab-settings").click();
    await page.getByTestId("embargo-extend").waitFor();
    await shot(page, "embargo-configuracoes");
    await page.getByTestId("embargo-extend").click();
    await page.getByTestId("modal").waitFor();
    await shot(page, "embargo-estender", { target: page.getByTestId("modal") });

    await page.reload();
    await page.getByTestId("dataset-tab-settings").click();
    await page.getByTestId("embargo-end").click();
    await page.getByTestId("modal").waitFor();
    await shot(page, "embargo-encerrar", { target: page.getByTestId("modal") });
  },
};
