import { SearchIcon } from '@datamap/ui';

const caption = { fontSize: 11, marginTop: 6 } as const;
const col = { display: 'flex', flexDirection: 'column', alignItems: 'center' } as const;

export const Tones = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, padding: 16 }}>
    <div style={col}>
      <SearchIcon />
      <span className="text-primary-500" style={caption}>default · fill-primary-600</span>
    </div>
    <div style={col}>
      <SearchIcon className="fill-primary-900" />
      <span className="text-primary-500" style={caption}>fill-primary-900</span>
    </div>
    <div style={col}>
      <SearchIcon className="fill-success-700" />
      <span className="text-primary-500" style={caption}>fill-success-700</span>
    </div>
    <div style={col}>
      <SearchIcon className="fill-error-600" />
      <span className="text-primary-500" style={caption}>fill-error-600</span>
    </div>
    <div className="bg-primary-900 rounded-md" style={{ ...col, padding: '10px 14px' }}>
      <SearchIcon className="fill-primary-50" />
      <span className="text-primary-400" style={caption}>fill-primary-50 on dark</span>
    </div>
  </div>
);

export const InContext = () => (
  <div className="flex items-center gap-3 h-10 rounded-md px-3 text-sm border border-primary-200 bg-primary-0 text-primary-500" style={{ width: 380, margin: 16 }}>
    <SearchIcon className="fill-primary-500" />
    <span>Search datasets, e.g. &quot;aerosol optical depth&quot;</span>
  </div>
);
