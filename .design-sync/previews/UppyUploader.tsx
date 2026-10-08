import { UppyUploader } from '@datamap/ui';

const noop = () => {};

export const DropZone = () => (
  <div style={{ width: 640, padding: 16 }}>
    <UppyUploader datasetId="b7f3c2a4-goamazon-aod" onUppyStateCreated={noop} />
  </div>
);

export const InNewDatasetForm = () => (
  <div style={{ width: 640, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div>
      <div className="text-sm font-semibold text-primary-900">Data files</div>
      <div className="text-primary-500" style={{ fontSize: 13, marginTop: 4 }}>
        NetCDF (.nc), CSV or any format your instruments produce. Files upload as you add them.
      </div>
    </div>
    <UppyUploader datasetId="b7f3c2a4-goamazon-aod" onUppyStateCreated={noop} />
  </div>
);
