import { Alert } from '@datamap/ui';

const noop = () => {};

export const Success = () => (
  <div style={{ width: 640 }}>
    <Alert callout="Success" show closed={noop}>
      <p className="font-bold">The dataset &apos;GoAmazon 2014/5 aerosol optical depth&apos; was created with success!</p>
      <p>Now, fill in authors, license and coverage so other researchers can find and cite the data.</p>
    </Alert>
  </div>
);

export const Deleted = () => (
  <div style={{ width: 640 }}>
    <Alert callout="Dataset deleted" show closed={noop}>
      LAPAT CO₂ flux tower — raw 10 Hz (2019) was removed from the LAPAT tenancy.
    </Alert>
  </div>
);

export const DoiError = () => (
  <div style={{ width: 640 }}>
    <Alert callout="DOI Registration" show isError closed={noop}>
      <p className="text-primary-900">Error to execute DOI management. DataCite rejected 10.5072/datamap.4821: the landing URL is not reachable.</p>
    </Alert>
  </div>
);
