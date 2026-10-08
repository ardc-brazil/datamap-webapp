import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dist = join(here, "dist");
const require = createRequire(join(root, ".ds-sync/package.json"));
const esbuild = require("esbuild");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const svgDataUri = (name) =>
  `data:image/svg+xml;base64,${readFileSync(join(root, "public/img/brand", name)).toString("base64")}`;

// The app serves the Logo mark from /img/brand, which does not exist inside Claude Design.
const inlineBrandAssets = {
  name: "inline-brand-assets",
  setup(build) {
    build.onLoad({ filter: /components\/Brand\/Logo\.tsx$/ }, (args) => ({
      loader: "tsx",
      contents: readFileSync(args.path, "utf8").replace(/"\/img\/brand\/([\w-]+\.svg)"/g, (_, f) => JSON.stringify(svgDataUri(f))),
    }));
  },
};

await esbuild.build({
  entryPoints: [join(here, "index.ts")],
  outfile: join(dist, "index.js"),
  bundle: true,
  format: "esm",
  jsx: "automatic",
  packages: "external",
  alias: { "@": root },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_TUS_SERVICE_ENDPOINT": '"https://datamap.pcs.usp.br/files/"',
  },
  plugins: [inlineBrandAssets],
  logLevel: "warning",
});

try {
  execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", join(here, "tsconfig.json")], { stdio: "pipe" });
} catch (e) {
  // The app is not strict-clean; declarations still emit, so only surface the errors.
  console.error(String(e.stdout).split("\n").slice(0, 10).join("\n"));
}

const tw = join(dist, "tailwind.css");
execFileSync(join(root, "node_modules/.bin/tailwindcss"), ["-c", join(here, "tailwind.config.js"), "-i", join(root, "styles/globals.css"), "-o", tw], { stdio: "inherit", cwd: root });
writeFileSync(
  join(dist, "styles.css"),
  [
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');",
    // next/font sets --font-inter at runtime; undefined, it invalidates every font-family that references it.
    ":root { --font-inter: 'Inter'; }",
    readFileSync(tw, "utf8"),
  ].join("\n"),
);
rmSync(tw);

const symbols = join(root, "node_modules/react-material-symbols/dist");
copyFileSync(join(symbols, "material-symbols-outlined.woff2"), join(dist, "material-symbols-outlined.woff2"));
writeFileSync(
  join(dist, "styles.css"),
  [
    readFileSync(join(symbols, "common.css"), "utf8"),
    readFileSync(join(symbols, "outlined.css"), "utf8").replace(/@import[^;]+;/, ""),
  ].join("\n"),
  { flag: "a" },
);
console.log("built", dist);
