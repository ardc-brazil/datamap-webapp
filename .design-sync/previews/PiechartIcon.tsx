import { PiechartIcon } from '@datamap/ui';

const caption = { fontSize: 11, marginTop: 6 } as const;
const col = { display: 'flex', flexDirection: 'column', alignItems: 'center' } as const;

export const Tones = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, padding: 16 }}>
    <div style={col}>
      <PiechartIcon />
      <span className="text-primary-500" style={caption}>default · fill-primary-600</span>
    </div>
    <div style={col}>
      <PiechartIcon className="fill-primary-900" />
      <span className="text-primary-500" style={caption}>fill-primary-900</span>
    </div>
    <div style={col}>
      <PiechartIcon className="fill-success-700" />
      <span className="text-primary-500" style={caption}>fill-success-700</span>
    </div>
    <div style={col}>
      <PiechartIcon className="fill-error-600" />
      <span className="text-primary-500" style={caption}>fill-error-600</span>
    </div>
    <div className="bg-primary-900 rounded-md" style={{ ...col, padding: '10px 14px' }}>
      <PiechartIcon className="fill-primary-50" />
      <span className="text-primary-400" style={caption}>fill-primary-50 on dark</span>
    </div>
  </div>
);

export const InContext = () => (
  <div className="bg-primary-50 border border-primary-200 rounded-md" style={{ width: 240, margin: 16, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div className="flex items-center gap-3 h-10 rounded-md px-3 text-sm bg-secondary-500 font-semibold text-primary-900"><PiechartIcon className="fill-primary-900" /><span>Usage statistics</span></div>
    <div className="flex items-center gap-3 h-10 rounded-md px-3 text-sm font-medium text-primary-700"><PiechartIcon className="fill-primary-500" /><span>Storage by tenancy</span></div>
  </div>
);
