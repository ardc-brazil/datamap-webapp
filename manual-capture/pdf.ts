import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";
import { WEBAPP_URL } from "./config";

const PDF_FILE = path.resolve(__dirname, "../public/manual/guia-datamap.pdf");
const FOOTER = `<div style="width:100%;font-size:9px;font-family:Inter,Arial,sans-serif;color:#6b7280;text-align:center"><span class="pageNumber"></span> de <span class="totalPages"></span></div>`;

async function main(): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.emulateMedia({ media: "print" });
    await page.goto(`${WEBAPP_URL}/manual/imprimir`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      document.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
      await Promise.all(Array.from(document.images).map((image) => image.complete ? null : new Promise((resolve) => { image.onload = image.onerror = resolve; })));
      await document.fonts.ready;
    });
    const staged = `${PDF_FILE}.tmp`;
    await page.pdf({
      path: staged,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: FOOTER,
      margin: { top: "20mm", bottom: "22mm", left: "18mm", right: "18mm" },
    });
    fs.renameSync(staged, PDF_FILE);
    console.log(`${path.relative(process.cwd(), PDF_FILE)}: ${(fs.statSync(PDF_FILE).size / 1024).toFixed(0)} KB`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
