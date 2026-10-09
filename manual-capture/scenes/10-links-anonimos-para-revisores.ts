import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signInTo } from "./helpers";

export const linksAnonimos: Scene = {
  id: "10",
  async run({ seed, newPage, shot }) {
    const page = await newPage();
    await signInTo(page, seed.ana, seed.password, seed.workspace.path);
    await page.goto(`${WEBAPP_URL}/app/datasets/${seed.datasets.embargo}`);
    await page.getByTestId("share-button").click();
    await page.getByTestId("anonymous-links").waitFor();
    await shot(page, "link-anonimo-lista", { target: page.getByTestId("share-dialog"), highlight: [page.getByTestId("anonymous-new")], mask: [page.getByTestId("anonymous-link-hint")] });
    await page.getByTestId("anonymous-new").click();
    await page.getByTestId("modal").waitFor();
    await shot(page, "link-anonimo-novo", { target: page.getByTestId("modal") });

    const revisor = await newPage();
    await revisor.goto(`${WEBAPP_URL}${new URL(seed.anonymousLink.url).pathname}`);
    await revisor.getByTestId("anonymous-banner").waitFor();
    await shot(revisor, "link-anonimo-revisor");
  },
};
