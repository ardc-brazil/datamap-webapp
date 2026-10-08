import { Separator } from '@datamap/ui';

export const BetweenSections = () => (
  <div style={{ width: 560 }}>
    <div className="flex flex-col gap-1">
      <span className="text-xs text-primary-500">LAPAT / production / atmosphere</span>
      <h1 className="text-3xl font-semibold text-primary-900">LAPAT CO₂ flux tower</h1>
    </div>
    <Separator className="my-8" orientation="horizontal" />
    <div className="flex flex-col gap-2">
      <h4 className="text-base font-semibold text-primary-900">About Dataset</h4>
      <p className="text-sm text-primary-700">
        Half-hourly eddy-covariance CO₂ and H₂O fluxes from the São Paulo urban tower, 2019 onwards.
      </p>
    </div>
  </div>
);

export const Vertical = () => (
  <div className="flex items-center gap-4 text-sm text-primary-700" style={{ height: 20 }}>
    <span>Version 3</span>
    <Separator orientation="vertical" />
    <span>12,480 files</span>
    <Separator orientation="vertical" />
    <span>48.2 GB</span>
    <Separator orientation="vertical" />
    <span>doi: 10.5072/datamap.4821</span>
  </div>
);
