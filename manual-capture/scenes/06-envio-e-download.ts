import path from "path";
import { Page, Route } from "@playwright/test";
import { FIXTURES_DIR, WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signIn } from "./helpers";

const TUS = /\/files\//;
const ARQUIVOS = [
  path.join(FIXTURES_DIR, "temperatura-manaus.nc"),
  path.join(FIXTURES_DIR, "estacao-manaus.csv"),
];

async function openDrawerWithFiles(page: Page, datasetId: string): Promise<void> {
  await page.goto(`${WEBAPP_URL}/app/datasets/${datasetId}`);
  await page.getByTestId("new-version-button").click();
  await page.getByTestId("drawer").waitFor();
  await page.getByTestId("uppy-uploader").locator("input[type=file]").first().setInputFiles(ARQUIVOS);
  await page.getByTestId("uppy-uploader").getByText("temperatura-manaus.nc").first().waitFor();
}

export const envioEDownload: Scene = {
  id: "06",
  async run({ seed, newPage, shot }) {
    const comFalha = await newPage();
    await signIn(comFalha, seed.ana.email, seed.password);
    await openDrawerWithFiles(comFalha, seed.datasets.rascunho);
    await shot(comFalha, "envio-arquivos-adicionados", { target: comFalha.getByTestId("drawer") });

    // O token de envio adulterado faz o gatekeeper recusar o aviso do tusd.
    await comFalha.route(TUS, (route: Route) =>
      route.continue({ headers: { ...route.request().headers(), "x-user-token": "token-invalido" } })
    );
    await comFalha.getByTestId("drawer-create").click();
    await comFalha.getByTestId("new-version-error-message").waitFor({ timeout: 30_000 });
    await shot(comFalha, "envio-falha", { target: comFalha.getByTestId("drawer"), hide: [".uppy-Informer"] });

    // Sessão nova: o tus guarda no navegador o ponto onde cada envio parou.
    const page = await newPage();
    await signIn(page, seed.ana.email, seed.password);
    await openDrawerWithFiles(page, seed.datasets.rascunho);
    const drawer = page.getByTestId("drawer");

    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let reachedPoint: () => void = () => {};
    const atPoint = new Promise<void>((resolve) => { reachedPoint = resolve; });
    let held = 0;
    await page.route(TUS, async (route: Route) => {
      if (route.request().method() !== "PATCH") {
        return route.continue();
      }
      const response = await route.fetch();
      if (++held === ARQUIVOS.length) {
        reachedPoint();
      }
      await gate;
      return route.fulfill({ response });
    });
    await page.getByTestId("drawer-create").click();
    await atPoint;
    await shot(page, "envio-em-progresso", { target: drawer, hide: [".uppy-Informer"] });

    release();
    await page.getByTestId("new-version-success-message").waitFor({ timeout: 30_000 });
    await shot(page, "envio-concluido", { target: drawer });
    await page.unroute(TUS);

    await drawer.getByRole("button", { name: "Close" }).last().click();
    await page.getByTestId("dataset-file-row").first().waitFor();
    const lista = page.getByTestId("dataset-files");
    await shot(page, "versao-publicada-arquivos", { target: lista });
    await shot(page, "download-arquivo", { target: lista, highlight: [page.getByTestId("file-download").first()] });
  },
};
