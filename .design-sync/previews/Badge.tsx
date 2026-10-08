import { Badge } from '@datamap/ui';

export const Variants = () => (
  <div className="flex items-center gap-2">
    <Badge>v2.1</Badge>
    <Badge variant="secondary">Public</Badge>
    <Badge variant="destructive">Embargoed</Badge>
    <Badge variant="outline">NetCDF</Badge>
  </div>
);

export const FileFormats = () => (
  <div className="flex flex-wrap items-center gap-2" style={{ width: 320 }}>
    <Badge variant="outline">.nc</Badge>
    <Badge variant="outline">.csv</Badge>
    <Badge variant="outline">.json</Badge>
    <Badge variant="outline">.hdf5</Badge>
    <Badge variant="outline">.txt</Badge>
  </div>
);

export const DatasetStatus = () => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2 text-sm text-primary-900">
      <span className="font-medium">LAPAT CO₂ flux tower</span>
      <Badge>v3</Badge>
      <Badge variant="secondary">Public</Badge>
    </div>
    <div className="flex items-center gap-2 text-sm text-primary-900">
      <span className="font-medium">GoAmazon 2014/5 aerosol optical depth</span>
      <Badge>v2.1</Badge>
      <Badge variant="destructive">Embargoed</Badge>
    </div>
  </div>
);
