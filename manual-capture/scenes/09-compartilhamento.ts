import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signInTo } from "./helpers";

export const compartilhamento: Scene = {
  id: "09",
  async run({ seed, newPage, shot }) {
    const page = await newPage();
    await signInTo(page, seed.ana, seed.password, seed.workspace.path);
    await page.goto(`${WEBAPP_URL}/app/datasets/${seed.datasets.embargo}`);
    await page.getByTestId("access-card").waitFor();
    await shot(page, "compartilhar-acesso", { highlight: [page.getByTestId("share-button"), page.getByTestId("access-manage")] });

    await page.getByTestId("share-button").click();
    await page.getByTestId("share-dialog").waitFor();
    await shot(page, "compartilhar-dialogo", { target: page.getByTestId("share-dialog"), mask: [page.getByTestId("anonymous-link-hint")] });

    await page.reload();
    await page.getByTestId("dataset-tab-settings").click();
    await page.getByTestId("access-history").waitFor();
    await shot(page, "historico-de-acesso", { target: page.getByTestId("access-history"), mask: [page.getByTestId("history-when")] });
  },
};
