import { NotebookIcon } from '@datamap/ui';

const caption = { fontSize: 11, marginTop: 6 } as const;
const col = { display: 'flex', flexDirection: 'column', alignItems: 'center' } as const;

export const OnLightSurfaces = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, padding: 16 }}>
    <div className="bg-primary-0 border border-primary-200 rounded-md" style={{ ...col, padding: '10px 14px' }}>
      <NotebookIcon />
      <span className="text-primary-500" style={caption}>on primary-0</span>
    </div>
    <div className="bg-primary-50 border border-primary-200 rounded-md" style={{ ...col, padding: '10px 14px' }}>
      <NotebookIcon />
      <span className="text-primary-500" style={caption}>on primary-50</span>
    </div>
    <div className="bg-secondary-500 rounded-md" style={{ ...col, padding: '10px 14px' }}>
      <NotebookIcon />
      <span className="text-primary-700" style={caption}>on secondary-500</span>
    </div>
  </div>
);

export const InContext = () => (
  <div className="bg-primary-50 border border-primary-200 rounded-md" style={{ width: 240, margin: 16, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div className="flex items-center gap-3 h-10 rounded-md px-3 text-sm bg-secondary-500 font-semibold text-primary-900"><NotebookIcon className="fill-primary-900" /><span>Notebooks</span></div>
    <div className="flex items-center gap-3 h-10 rounded-md px-3 text-sm font-medium text-primary-700"><NotebookIcon className="fill-primary-500" /><span>co2_flux_qc.ipynb</span></div>
  </div>
);
