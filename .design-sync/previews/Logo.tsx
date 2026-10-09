import { Logo } from '@datamap/ui';

const caption = { fontSize: 11, marginTop: 8 } as const;

export const Sizes = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, padding: 20 }}>
    {(['sm', 'md', 'lg'] as const).map((s) => (
      <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Logo size={s} />
        <span className="text-primary-500" style={caption}>size=&quot;{s}&quot;</span>
      </div>
    ))}
  </div>
);

export const Inverse = () => (
  <div className="bg-primary-900 rounded-md" style={{ display: 'flex', alignItems: 'center', gap: 40, padding: '24px 28px', width: 560 }}>
    <Logo inverse />
    <span className="text-primary-400" style={{ fontSize: 13 }}>Atmospheric data for research · USP</span>
  </div>
);

export const InNavbar = () => (
  <div className="bg-primary-50 border border-primary-200" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 20px', width: 640 }}>
    <Logo size="md" />
    <div className="text-sm font-medium text-primary-700" style={{ display: 'flex', gap: 24 }}>
      <span>Datasets</span>
      <span>Notebooks</span>
      <span>About</span>
    </div>
  </div>
);
