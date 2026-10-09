import fs from "fs";
import { ADMIN_USER_ID, PASSWORD, SEED_FILE, WORK_DIR } from "./config";
import { asAdmin, call, headers, newestCode } from "./gatekeeper";

export interface Seed {
  clock: string;
  password: string;
  ana: { id: string; name: string; email: string };
  bruno: { id: string; name: string; email: string };
  admin: { id: string; name: string; email: string };
  workspace: { path: string; name: string };
  datasets: { publicado: string; embargo: string; rascunho: string };
  anonymousLink: { id: string; url: string };
}

const WORKSPACE_NAME = "Clima Amazônia";
const WORKSPACE_NAMESPACE = "clima-amazonia";

async function signUp(name: string, email: string) {
  const started = await call("POST", "/auth/sign-up", { headers: headers(), body: { name, email, password: PASSWORD } }, [202]);
  const code = await newestCode(email);
  const confirmed = await call("POST", `/auth/sign-up/${started.challenge_id}/confirm`, { headers: headers(), body: { code } }, [200]);
  return { id: confirmed.user_id as string, name, email };
}

function noon(daysFromToday: number): Date {
  const date = new Date();
  date.setUTCHours(15, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date;
}

async function createDataset(userId: string, tenancy: string, title: string, description: string) {
  const dataset = await call("POST", "/datasets/", {
    headers: headers(userId, tenancy),
    body: {
      name: title,
      tenancy,
      data: {
        title,
        description,
        authors: [{ name: "Ana Pesquisadora" }],
        institution: "Universidade de São Paulo",
        license: "CC-BY-4.0",
      },
    },
  }, [201]);
  return { id: dataset.id as string, versionName: dataset.current_version.name as string };
}

async function publish(userId: string, tenancy: string, datasetId: string, versionName: string) {
  await call("PUT", `/datasets/${datasetId}/versions/${versionName}/publish`, { headers: headers(userId, tenancy) }, [200]);
}

async function main() {
  const ana = await signUp("Ana Pesquisadora", "ana.pesquisadora@example.com");
  const bruno = await signUp("Bruno Revisor", "bruno.revisor@example.com");
  const admin = await signUp("Admin DataMap", "admin.datamap@example.com");
  await call("PUT", `/users/${admin.id}/roles`, { headers: asAdmin(), body: ["admin"] }, [200]);

  const created = await call("POST", "/admin/tenancies", {
    headers: asAdmin(),
    body: { display_name: WORKSPACE_NAME, namespace: WORKSPACE_NAMESPACE },
  }, [200, 201]);
  const path: string = created.path ?? created.name;
  await call("POST", `/admin/tenancies/${path}/members`, { headers: asAdmin(), body: { user_id: ana.id } }, [200, 201]);

  await call("POST", `/users/${bruno.id}/tenancy-requests`, {
    headers: headers(bruno.id),
    body: { tenancy_name: WORKSPACE_NAME, reason: "Vou revisar o artigo que cita o dataset de temperatura." },
  }, [200, 201]);

  const publicado = await createDataset(ana.id, path, "Temperatura do ar em Manaus, 2025", "Medições horárias de temperatura do ar na estação de Manaus.");
  await publish(ana.id, path, publicado.id, publicado.versionName);
  await call("POST", `/datasets/${publicado.id}/versions/${publicado.versionName}/doi`, { headers: headers(ana.id, path), body: { mode: "AUTO" } }, [200, 201]);
  await call("PUT", `/datasets/${publicado.id}/versions/${publicado.versionName}/doi`, { headers: headers(ana.id, path), body: { state: "FINDABLE" } }, [200]);
  await call("POST", `/datasets/${publicado.id}/share`, { headers: headers(ana.id, path), body: { level: "read", user_id: bruno.id } }, [200, 201]);

  const embargo = await createDataset(ana.id, path, "Fluxos de CO₂ na floresta, 2026", "Dados em revisão, sob embargo até a publicação do artigo.");
  await publish(ana.id, path, embargo.id, embargo.versionName);
  await call("PUT", `/datasets/${embargo.id}/embargo`, {
    headers: headers(ana.id, path),
    body: { until: noon(60).toISOString(), metadata_visible: true, note: "Até a publicação do artigo." },
  }, [200]);
  const anonymous = await call("POST", `/datasets/${embargo.id}/anonymous-links`, { headers: headers(ana.id, path), body: { label: "Revisão do periódico, rodada 1" } }, [201]);
  console.log("anonymous link response keys:", Object.keys(anonymous).join(","));
  await call("POST", `/datasets/${embargo.id}/share`, { headers: headers(ana.id, path), body: { level: "read", email: "colega.convidada@example.com" } }, [200, 201]);

  const rascunho = await createDataset(ana.id, path, "Perfis verticais de vento, rascunho", "Ainda sem versão publicada.");

  const seed: Seed = {
    clock: noon(0).toISOString(),
    password: PASSWORD,
    ana,
    bruno,
    admin,
    workspace: { path, name: WORKSPACE_NAME },
    datasets: { publicado: publicado.id, embargo: embargo.id, rascunho: rascunho.id },
    anonymousLink: { id: anonymous.id, url: anonymous.url ?? anonymous.link },
  };
  fs.mkdirSync(WORK_DIR, { recursive: true });
  fs.writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2));
  console.log(`seed: ${SEED_FILE} (admin ${ADMIN_USER_ID})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
