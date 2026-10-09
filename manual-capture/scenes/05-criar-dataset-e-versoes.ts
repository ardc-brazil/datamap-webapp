import { expect } from "@playwright/test";
import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signInTo } from "./helpers";

export const criarDataset: Scene = {
  id: "05",
  async run({ seed, newPage, shot }) {
    const page = await newPage();
    await signInTo(page, seed.ana, seed.password, seed.workspace.path);
    await page.goto(`${WEBAPP_URL}/app/datasets/new`);
    await expect(page.getByTestId("new-dataset-submit")).toBeEnabled({ timeout: 30_000 });
    await shot(page, "dataset-novo-formulario");

    await page.goto(`${WEBAPP_URL}/app/datasets/${seed.datasets.publicado}`);
    await page.getByTestId("new-version-button").waitFor();
    await shot(page, "dataset-pagina", { highlight: [page.getByTestId("new-version-button")], mask: [page.getByTestId("fact-doi")] });
  },
};
