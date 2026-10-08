# DataMap design conventions

DataMap is a research-data platform (atmospheric datasets, versions, DOIs, embargoes). Its UI is quiet and
near-monochrome: white surfaces, near-black primary actions, thin gray borders, Inter, Material Symbols icons.

## Setup
No provider is needed. Link `styles.css` (Tailwind output + Inter + Material Symbols font), then use
`window.DataMap.*`. Inter is the default font (set on `html`); headings `h1`–`h5`, `p`, `label`, `input`, `select`,
`textarea` and `a` are already styled globally — use plain elements for forms and copy.

## Styling idiom: Tailwind utility classes, this theme's palette only
The theme REPLACES Tailwind's colors: `gray-*`, `white`, `black`, `red-*`, `blue-*` do not exist and render
unstyled. Only classes compiled into `_ds_bundle.css` work — check there before using an unusual utility, and
use inline `style` for one-off sizes.

| Family | Classes | Use |
|---|---|---|
| Neutral scale | `primary-0` (white) `50 100 200 300 400 500 600 700 800 900` (near-black) | `bg-primary-0` surfaces, `bg-primary-50` page, `border-primary-200` dividers, `text-primary-900` headings, `text-primary-700` body, `text-primary-500` secondary text |
| Status | `error-*` (red), `success-*` (one flat green), `embargo-50/100/200/800` (amber), `danger-50/200/700/800` | errors, published, embargo banners, destructive notices |
| Accent tint | `secondary-50…900` (pale teal-gray) | soft callouts (`Alert` uses `bg-secondary-500`) |
| shadcn tokens | `bg-background` `text-foreground` `bg-muted` `text-muted-foreground` `border-border` `bg-card` `bg-accent` `ring-ring` | inside `components/ui` parts and to match them |

Recurring app recipes: panel `bg-primary-0 border border-primary-200 rounded-lg`; small label
`text-[13px] text-primary-500`; overlay scrim `bg-primary-900/40`; type scale `display-1`…`display-5`;
dotted backdrop `special-background`. Legacy button classes `btn-primary`, `btn-primary-outline`, `btn-small`
exist, but prefer `<Button>`.

## Components
- Actions: `Button` (`variant` default | outline | secondary | ghost | destructive | link; `size` sm | default | lg | icon), `Badge`.
- Containers: `Card` + `CardHeader/CardTitle/CardDescription/CardContent/CardFooter`; `Table` family; `Accordion` family; `ScrollArea`; `Separator`.
- Overlays: `PopupModal` (the app's standard confirm dialog — `show`, `title`, `confimButtonText` [sic], `confim`, `cancel`, `destructive`, `maxWidthClassName="max-w-[440px]"`), `Drawer` (right slide-over), Radix `Dialog` family. Dialog's backdrop is transparent in this theme; prefer `PopupModal`.
- Feedback: `Alert` (`show`, `callout`, `isError`), `CloseButton`.
- Brand/icons: `Logo` (`size` sm | md | lg, `inverse` on dark), `MaterialSymbol` — the icon system. App convention: `weight={200} grade={-25}`, `size` 18–24. `Icons/*` SVGs are legacy and fixed at 20px.
- Upload: `UppyUploader` (Uppy drop zone; decorative outside the app).

Each component's `components/<group>/<Name>/<Name>.prompt.md` has working examples; `<Name>.d.ts` is the API.

## Example
```jsx
const { Card, CardHeader, CardTitle, CardDescription, CardFooter, Button, Badge, MaterialSymbol } = window.DataMap;

<div className="bg-primary-50 p-6 flex flex-col gap-4">
  <h3>Datasets</h3>
  <Card className="w-[380px]">
    <CardHeader>
      <div className="flex items-center gap-2">
        <CardTitle>GoAmazon 2014/5 — aerosol optical depth</CardTitle>
        <Badge variant="outline">NetCDF</Badge>
      </div>
      <CardDescription>Version 2.1 · doi: 10.5072/datamap.4821</CardDescription>
    </CardHeader>
    <CardFooter className="gap-2">
      <Button size="sm"><MaterialSymbol icon="download" size={18} weight={200} grade={-25} />Download</Button>
      <Button size="sm" variant="outline">Cite</Button>
    </CardFooter>
  </Card>
</div>
```
