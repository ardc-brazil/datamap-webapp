import { MaterialSymbol } from '@datamap/ui';

const icons = ['home', 'database', 'code', 'person', 'lock', 'download', 'folder', 'search', 'info', 'warning', 'check_circle', 'close'];

const cell = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 76 } as const;
const caption = { fontSize: 11 } as const;

export const AppIcons = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 16, width: 560 }}>
    {icons.map((i) => (
      <div key={i} style={cell}>
        <MaterialSymbol icon={i as any} size={24} weight={200} grade={-25} className="text-primary-900" />
        <span className="text-primary-500" style={caption}>{i}</span>
      </div>
    ))}
  </div>
);

export const FillAndWeight = () => (
  <div style={{ display: 'flex', gap: 20, padding: 16, alignItems: 'flex-end' }}>
    <div style={cell}><MaterialSymbol icon="lock" size={28} weight={200} grade={-25} className="text-primary-900" /><span className="text-primary-500" style={caption}>outlined 200</span></div>
    <div style={cell}><MaterialSymbol icon="lock" size={28} weight={400} grade={-25} className="text-primary-900" /><span className="text-primary-500" style={caption}>weight 400</span></div>
    <div style={cell}><MaterialSymbol icon="lock" size={28} weight={400} grade={-25} fill className="text-primary-900" /><span className="text-primary-500" style={caption}>fill</span></div>
    <div style={cell}><MaterialSymbol icon="check_circle" size={28} weight={400} grade={-25} fill className="text-success-700" /><span className="text-primary-500" style={caption}>success</span></div>
    <div style={cell}><MaterialSymbol icon="error" size={28} weight={400} grade={-25} fill className="text-error-600" /><span className="text-primary-500" style={caption}>error</span></div>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 24, padding: 16, alignItems: 'flex-end' }}>
    {[18, 20, 24, 36, 48].map((s) => (
      <div key={s} style={cell}>
        <MaterialSymbol icon="upload_file" size={s} weight={200} grade={-25} className="text-primary-700" />
        <span className="text-primary-500" style={caption}>{s}px</span>
      </div>
    ))}
  </div>
);

export const InNavItem = () => (
  <div className="bg-primary-50 border border-primary-200 rounded-md" style={{ width: 240, margin: 16, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div className="flex items-center gap-3 h-10 rounded-md px-3 text-sm bg-secondary-500 font-semibold text-primary-900">
      <MaterialSymbol icon="database" size={20} weight={400} grade={-25} fill className="text-primary-900" />
      <span>Datasets</span>
    </div>
    <div className="flex items-center gap-3 h-10 rounded-md px-3 text-sm font-medium text-primary-700">
      <MaterialSymbol icon="code" size={20} weight={400} grade={-25} className="text-primary-500" />
      <span>Notebooks</span>
    </div>
    <div className="flex items-center gap-3 h-10 rounded-md px-3 text-sm font-medium text-primary-700">
      <MaterialSymbol icon="person" size={20} weight={400} grade={-25} className="text-primary-500" />
      <span>Profile</span>
    </div>
  </div>
);
