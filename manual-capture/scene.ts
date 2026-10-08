import fs from "fs";
import path from "path";
import { Browser, BrowserContext, Locator, Page } from "@playwright/test";
import { DEVICE_SCALE_FACTOR, VIEWPORT } from "./config";
import { Seed } from "./seed";

export interface ShotOptions {
  /** Recorta no elemento em vez da janela. */
  target?: Locator;
  /** Cobre valores que mudam a cada rodada (ids, tokens, horas). */
  mask?: Locator[];
  /** Contorno e número sobre os elementos citados no texto, na ordem. */
  highlight?: Locator[];
  fullPage?: boolean;
  /** Esconde avisos passageiros que não fazem parte da tela descrita. */
  hide?: string[];
}

export interface SceneContext {
  seed: Seed;
  newPage(): Promise<Page>;
  shot(page: Page, name: string, options?: ShotOptions): Promise<void>;
}

export interface Scene {
  id: string;
  run(context: SceneContext): Promise<void>;
}

const MASK_COLOR = "#e5e7eb";

async function addHighlights(page: Page, locators: Locator[]): Promise<void> {
  for (const [index, locator] of locators.entries()) {
    const box = await locator.boundingBox();
    if (!box) {
      throw new Error(`destaque ${index + 1}: o elemento não está visível`);
    }
    await page.evaluate(({ box, number }) => {
      const frame = document.createElement("div");
      frame.setAttribute("data-manual-highlight", "");
      frame.style.cssText = `position:absolute;z-index:100000;pointer-events:none;border:2px solid #dc2626;border-radius:6px;left:${box.x + window.scrollX - 4}px;top:${box.y + window.scrollY - 4}px;width:${box.width + 8}px;height:${box.height + 8}px`;
      const badge = document.createElement("span");
      badge.textContent = String(number);
      badge.style.cssText = "position:absolute;left:-12px;top:-12px;width:22px;height:22px;border-radius:11px;background:#dc2626;color:#fff;font:600 13px Inter,sans-serif;display:flex;align-items:center;justify-content:center";
      frame.appendChild(badge);
      document.body.appendChild(frame);
    }, { box, number: index + 1 });
  }
}

async function removeHighlights(page: Page): Promise<void> {
  await page.evaluate(() => document.querySelectorAll("[data-manual-highlight]").forEach((node) => node.remove()));
}

export function sceneContext(browser: Browser, seed: Seed, outDir: string, onShot: (name: string) => void): SceneContext {
  const contexts: BrowserContext[] = [];

  return {
    seed,
    async newPage() {
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
        reducedMotion: "reduce",
        locale: "en-US",
        timezoneId: "America/Sao_Paulo",
        colorScheme: "light",
      });
      contexts.push(context);
      const page = await context.newPage();
      await page.clock.setFixedTime(new Date(seed.clock));
      return page;
    },
    async shot(page, name, options = {}) {
      onShot(name);
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
      const hidden = options.hide?.length
        ? await page.addStyleTag({ content: `${options.hide.join(",")}{visibility:hidden!important}` })
        : undefined;
      await addHighlights(page, options.highlight ?? []);
      const file = path.join(outDir, `${name}.png`);
      const mask = [...(options.mask ?? []), page.locator("time")];
      const common = { path: file, mask, maskColor: MASK_COLOR, animations: "disabled" as const };
      if (options.target) {
        await options.target.screenshot(common);
      } else {
        await page.screenshot({ ...common, fullPage: options.fullPage });
      }
      await removeHighlights(page);
      await hidden?.evaluate((node) => (node as Element).remove());
      if (!fs.existsSync(file)) {
        throw new Error(`${name}: a captura não foi escrita`);
      }
    },
  };
}
