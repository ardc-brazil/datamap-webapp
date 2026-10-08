import { WEBAPP_URL } from "../config";
import { Scene } from "../scene";
import { chooseWorkspace, signIn, signInTo } from "./helpers";

export const workspaces: Scene = {
  id: "03",
  async run({ seed, newPage, shot }) {
    const ana = await newPage();
    await signIn(ana, seed.ana.email, seed.password);
    await ana.goto(`${WEBAPP_URL}/app/tenancy`);
    await ana.getByTestId(`tenancy-option-${seed.workspace.path}`).waitFor();
    await shot(ana, "workspace-escolher");

    await chooseWorkspace(ana, seed.workspace.path);
    await ana.goto(`${WEBAPP_URL}/app/members`);
    await ana.getByTestId("members-invite").waitFor();
    await shot(ana, "membros-pagina");
    await ana.getByTestId("members-invite").click();
    await ana.getByTestId("modal").waitFor();
    await shot(ana, "membros-convidar", { target: ana.getByTestId("modal") });

    const bruno = await newPage();
    await signInTo(bruno, seed.bruno, seed.password);
    await bruno.goto(`${WEBAPP_URL}/app/profile`);
    await bruno.getByTestId("profile-request-access").waitFor();
    await shot(bruno, "workspace-pedido-pendente", { target: bruno.getByTestId("profile-tenancies") });
    await bruno.getByTestId("profile-request-access").click();
    await bruno.getByTestId("modal").waitFor();
    await shot(bruno, "workspace-pedir-acesso", { target: bruno.getByTestId("modal") });
  },
};
