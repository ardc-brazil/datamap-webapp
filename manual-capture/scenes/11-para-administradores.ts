import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { signInTo } from "./helpers";

export const administradores: Scene = {
  id: "11",
  async run({ seed, newPage, shot }) {
    const page = await newPage();
    await signInTo(page, seed.admin, seed.password);
    await page.goto(`${WEBAPP_URL}/app/admin/requests`);
    await page.getByTestId("admin-request-row").first().waitFor();
    await shot(page, "admin-pedidos", { highlight: [page.getByTestId("admin-request-review")] });
    await page.getByTestId("admin-request-review").click();
    await page.getByTestId("modal-confirm").waitFor();
    await shot(page, "admin-revisar-pedido", { target: page.getByTestId("modal") });

    await page.goto(`${WEBAPP_URL}/app/admin/tenancies`);
    await page.getByTestId(`admin-tenancy-${seed.workspace.path}`).click();
    await page.getByTestId("admin-member-add").waitFor();
    await shot(page, "admin-workspaces", { highlight: [page.getByTestId("admin-new-tenancy"), page.getByTestId("admin-member-add")] });
    await page.getByTestId("admin-new-tenancy").click();
    await page.getByTestId("modal").waitFor();
    await shot(page, "admin-novo-workspace", { target: page.getByTestId("modal") });
  },
};
