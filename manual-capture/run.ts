import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";
import { IMAGE_DIR, SEED_FILE, WORK_DIR } from "./config";
import { sceneContext } from "./scene";
import { Seed } from "./seed";
import { primeirosPassos } from "./scenes/01-primeiros-passos";
import { envioEDownload } from "./scenes/06-envio-e-download";

const SCENES = [primeirosPassos, envioEDownload];

function swapIn(staged: string): void {
  const next = `${IMAGE_DIR}.next`;
  const previous = `${IMAGE_DIR}.previous`;
  fs.rmSync(next, { recursive: true, force: true });
  fs.rmSync(previous, { recursive: true, force: true });
  fs.mkdirSync(next, { recursive: true });
  if (fs.existsSync(IMAGE_DIR)) {
    fs.cpSync(IMAGE_DIR, next, { recursive: true });
  }
  fs.cpSync(staged, next, { recursive: true });
  if (fs.existsSync(IMAGE_DIR)) {
    fs.renameSync(IMAGE_DIR, previous);
  }
  fs.renameSync(next, IMAGE_DIR);
  fs.rmSync(previous, { recursive: true, force: true });
}

async function main(): Promise<void> {
  const seed: Seed = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
  const only = process.env.MANUAL_SCENES?.split(",");
  const selected = SCENES.filter((scene) => !only || only.includes(scene.id));
  const staged = path.join(WORK_DIR, `capturas-${process.pid}`);
  fs.rmSync(staged, { recursive: true, force: true });
  fs.mkdirSync(staged, { recursive: true });

  const browser = await chromium.launch();
  let current = "";
  try {
    for (const scene of selected) {
      console.log(`cena ${scene.id}`);
      await scene.run(sceneContext(browser, seed, staged, (name) => { current = name; console.log(`  ${name}.png`); }));
    }
  } catch (error) {
    console.error(`\nA cena falhou perto da captura "${current}". Nenhuma imagem foi trocada.`);
    console.error(error);
    process.exitCode = 1;
    return;
  } finally {
    await browser.close();
  }

  swapIn(staged);
  fs.rmSync(staged, { recursive: true, force: true });
  console.log(`\n${fs.readdirSync(IMAGE_DIR).length} imagens em ${path.relative(process.cwd(), IMAGE_DIR)}`);
}

main();
