# design-sync notes — DataMap webapp

## How this repo is wired
- The webapp is a Next.js app, not a package. `.design-sync/pkg/` is a thin wrapper package (`@datamap/ui`):
  `index.ts` re-exports the real components by name (base/ and Icons/ are default exports), and
  `build.mjs` (= `cfg.buildCmd`) bundles it to `pkg/dist/index.js` (esbuild, packages external),
  emits `.d.ts` with `tsc`, and compiles Tailwind into `pkg/dist/styles.css` (= `cfg.cssEntry`).
- Run `node .design-sync/pkg/build.mjs` BEFORE `package-build.mjs` whenever source or previews change.
  `tsc` prints errors from UppyUploader (`FormValues`, styled-jsx `jsx` attr); declarations still emit — ignore.
- Tailwind content = app pages/components + `.design-sync/previews/**`, plus a safelist of every palette/semantic
  color family. A class used only in a preview exists only after `build.mjs` re-runs; `preview-rebuild.mjs` alone
  does not recompile CSS. Prefer inline styles for preview-only scaffolding (e.g. the PopupModal stage).
- `next-env.d.ts` must stay out of `pkg/tsconfig.json`: it pulls in `@vercel/og`, which augments every JSX element
  with `tw`, and the extractor then emits a required `tw: unknown` prop on every Radix wrapper.
- `@/` alias resolved by esbuild `alias` in build.mjs.
- Logo: build.mjs swaps `/img/brand/*.svg` for base64 data URIs at bundle time (the absolute path doesn't exist in
  Claude Design). The component source is otherwise the real one.
- `--font-inter` is set by next/font at runtime; build.mjs defines it as `'Inter'` and @imports Inter from Google
  Fonts. Without the definition every `font-family: var(--font-inter), …` is invalid and falls back to serif.
- Material Symbols: build.mjs appends react-material-symbols' `common.css` + `outlined.css` (the `.material-symbols`
  class rules) and copies the woff2. Harvesting only the @font-face rendered icon names as plain text.
- `cva` VariantProps don't resolve through the extractor: Button/Badge props are hand-written in `dtsPropsFor`,
  as are CloseButton, MaterialSymbol (generic `as?: C` leaked) and the untyped Icons.
- `componentSrcMap.Badge` pins `components/ui/badge.tsx` — fuzzy-find otherwise picks `components/Search/Badge.tsx`.

## Previews
- `position: fixed` components (PopupModal, Drawer) need a transformed parent in the preview so the cell is the
  containing block: `<div style={{position:'relative',height:400,width:640,transform:'translateZ(0)'}}>`.
- Theme `colors` REPLACE Tailwind's defaults: `gray-*`, `white`, `black`, `red-*` etc. do not exist. Use `primary-*`
  (neutral scale 0–900), `secondary-*`, `error-*`, `success-*`, `embargo-*`, `danger-*`, or shadcn semantic tokens.
- Only classes the app (or a preview) already uses exist in the compiled CSS, plus the safelisted color families.
  Check with `grep -cF '.<escaped-class> ' ds-bundle/_ds_bundle.css`; use inline `style` for anything else.
- Radix ScrollArea hides its scrollbar until hover: previews pass `type="always"` so the thumb shows.
- Dialog-family previews: one open dialog per file (`cardMode: single`, 720x480); several would stack via the portal.
- `Button variant="link"` inside a flex column stretches and centers its text — wrap it in a `<div>`.

## App findings surfaced by this sync (report, not fixed here)
- tailwindcss is 3.1.7: no `data-[…]:` / arbitrary variants (3.2+), no container queries. Every
  `data-[state=…]:` class in components/ui compiles to nothing — Dialog/Accordion don't animate, selected TableRow
  never highlights, `caption-bottom` is missing (TableCaption renders above the table). Faithful in previews.
- DialogOverlay `bg-black/80`: `black` isn't in the theme, so the dialog backdrop is transparent in the app.
- ExplorerSection extension chips use `text-gray-500 bg-gray-100` (nonexistent) — unstyled in production.
- Icons/*: fixed at 20px (`.w-5/.h-5` win by CSS order over size classes passed in className); `fill-primary-400`
  loses to the default `fill-primary-600`; omitted className renders the literal class "undefined";
  NotebookIcon hardcodes `fill="#1C274C"`; AvatarIcon's function is named SearchIcon. None of them is used by the
  app (it uses MaterialSymbol).
- Alert `isError` only works by CSS order (`bg-error-200` appended next to `bg-secondary-500`).
- `success-*` is a single flat green at every step; the app uses arbitrary `bg-[#dcfce7] text-[#14532d]` for a light
  success surface.

## Known render warns
(none yet)

## Re-sync risks
- `pkg/index.ts` is a hand-maintained barrel: a new component in components/ui or components/base does not sync
  until it is added there.
- The Logo data-URI swap in build.mjs matches the literal `"/img/brand/<file>.svg"` strings; if Logo.tsx changes
  how it builds the path, the swap silently stops and the mark breaks in Claude Design.
- `dtsPropsFor` for Button/Badge duplicates the cva variants — update it when variants change in button.tsx/badge.tsx.
- Inter loads from Google Fonts at runtime (network); `--font-inter` is defined in build.mjs, not by the app.
- A Tailwind upgrade (≥3.2) will change rendering of every shadcn component (data-state variants start working):
  expect most ui/ grades to need re-verification.

## Re-sync recipe
```sh
npm ci                                   # node 20.19.4 (.tool-versions)
S=<skill-base-dir>; mkdir -p .ds-sync && cp -r $S/package-build.mjs $S/package-validate.mjs $S/package-capture.mjs $S/resync.mjs $S/lib $S/storybook .ds-sync/
echo '{"name":"ds-sync-deps","private":true}' > .ds-sync/package.json && (cd .ds-sync && npm i esbuild ts-morph @types/react playwright)
node .design-sync/pkg/build.mjs          # cfg.buildCmd — always before the driver
# fetch _ds_sync.json from the project into .design-sync/.cache/remote-sync.json, then:
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
```
- Wide previews were moved to `cardMode: column` after `[GRID_OVERFLOW]`; Dialog/DialogTitle use an 880px viewport
  because DialogContent there is `max-w-3xl`.
