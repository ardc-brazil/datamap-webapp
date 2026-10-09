import { Drawer, MaterialSymbol } from '@datamap/ui';

const noop = () => {};

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', height: 460, width: 700, transform: 'translateZ(0)', overflow: 'hidden' }}>{children}</div>
);

const sectionHeading = 'm-0 pb-2 text-[11px] leading-4 tracking-[0.08em] uppercase font-semibold text-primary-500';

const files = [
  { name: 'goamazon_aod_t3_2014-02.nc', size: '48.2 MB' },
  { name: 'goamazon_aod_t3_2014-03.nc', size: '51.7 MB' },
  { name: 'station_metadata.csv', size: '12 KB' },
];

export const NewVersion = () => (
  <Stage>
    <Drawer
      title="New version"
      show
      showClearAllButton
      showCreateButton
      showCloseButton={false}
      onOpen={noop}
      onClose={noop}
      onCreate={noop}
      onClearAll={noop}
    >
      <h2 className={sectionHeading}>Previously uploaded</h2>
      <ul className="m-0 p-0 border border-primary-200 rounded-md" style={{ listStyle: 'none' }}>
        {files.map((f, i) => (
          <li key={f.name} className={`flex items-center gap-3 px-3 text-sm text-primary-900 ${i > 0 ? 'border-t border-primary-200' : ''}`} style={{ height: 44 }}>
            <MaterialSymbol icon="description" size={20} weight={200} grade={-25} className="text-primary-500" />
            <span style={{ flex: 1 }}>{f.name}</span>
            <span className="text-primary-500" style={{ fontSize: 12 }}>{f.size}</span>
          </li>
        ))}
      </ul>
      <h2 className={sectionHeading} style={{ paddingTop: 24 }}>New uploads</h2>
      <div className="border border-dashed border-primary-300 rounded-md text-primary-600" style={{ height: 84, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14 }}>
        <MaterialSymbol icon="upload_file" size={28} weight={200} grade={-25} className="text-primary-500" />
        Drop files here or browse
      </div>
    </Drawer>
  </Stage>
);

export const VersionCreated = () => (
  <Stage>
    <Drawer
      title="New version"
      show
      showClearAllButton={false}
      showCreateButton={false}
      showCloseButton
      onOpen={noop}
      onClose={noop}
      onCreate={noop}
      onClearAll={noop}
    >
      <div className="flex flex-col items-center gap-2 px-8 py-12 text-center">
        <span className="flex items-center justify-center h-12 w-12 rounded-full bg-[#dcfce7] text-[#14532d]">
          <MaterialSymbol icon="check" size={24} grade={-25} weight={400} />
        </span>
        <h6 className="m-0 pt-2 text-base font-semibold text-primary-900">Version created</h6>
        <p className="m-0 text-sm text-primary-600">Version 3 of GoAmazon 2014/5 aerosol optical depth was created successfully.</p>
      </div>
    </Drawer>
  </Stage>
);
