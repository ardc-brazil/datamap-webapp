import { CloseButton } from '@datamap/ui';

const noop = () => {};

const label = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 } as const;
const input = { width: '100%', height: 40, padding: '0 12px', fontSize: 14, boxSizing: 'border-box' } as const;

const Row = ({ name, removeLabel }: { name: string; removeLabel: string }) => (
  <div className="flex items-start gap-2">
    <div style={{ flex: 1, minWidth: 0 }}>
      <label className="text-primary-900" style={label}>Name</label>
      <input className="rounded-md border border-primary-300 bg-primary-0 text-primary-900" style={input} defaultValue={name} readOnly />
    </div>
    <div style={{ paddingTop: 26 }}>
      <CloseButton label={removeLabel} onClick={noop} />
    </div>
  </div>
);

export const InFileRow = () => (
  <ul className="m-0 p-0 border border-primary-200 rounded-md" style={{ listStyle: 'none', width: 520, margin: 16 }}>
    {['goamazon_aod_t3_2014-02.nc', 'lapat_co2_flux_2019-07.csv'].map((f, i) => (
      <li key={f} className={`flex items-center gap-3 text-sm text-primary-900 ${i > 0 ? 'border-t border-primary-200' : ''}`} style={{ height: 48, paddingLeft: 12, paddingRight: 4 }}>
        <span style={{ flex: 1 }}>{f}</span>
        <CloseButton label="Remove file" onClick={noop} />
      </li>
    ))}
  </ul>
);

export const InCollaboratorsList = () => (
  <div style={{ width: 520, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <Row name="Ana Ribeiro (IAG-USP)" removeLabel="Remove collaborator" />
    <Row name="Paulo Artaxo" removeLabel="Remove collaborator" />
    <Row name="LAPAT field team, ATTO tower" removeLabel="Remove collaborator" />
  </div>
);
