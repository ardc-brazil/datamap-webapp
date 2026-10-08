import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signInTo } from "./helpers";

export const encontrarDatasets: Scene = {
  id: "04",
  async run({ seed, newPage, shot }) {
    const ana = await newPage();
    await signInTo(ana, seed.ana, seed.password, seed.workspace.path);
    await ana.goto(`${WEBAPP_URL}/app/datasets`);
    await ana.getByTestId("dataset-list").getByText("Temperatura do ar em Manaus, 2025").waitFor();
    await shot(ana, "busca-lista");
    await shot(ana, "busca-filtros", { highlight: [ana.getByTestId("dataset-search"), ana.getByTestId("dataset-filters").locator("> *").first()] });

    const bruno = await newPage();
    await signInTo(bruno, seed.bruno, seed.password);
    await bruno.goto(`${WEBAPP_URL}/app/datasets/shared`);
    await bruno.getByTestId("dataset-list").getByText("Temperatura do ar em Manaus, 2025").waitFor();
    await shot(bruno, "compartilhados-comigo", { highlight: [bruno.getByTestId("datasets-tabs")] });
  },
};
