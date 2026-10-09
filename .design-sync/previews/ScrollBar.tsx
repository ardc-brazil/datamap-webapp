import { ScrollArea, ScrollBar, Separator, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@datamap/ui';

const files = [
  'aod_500nm_2014-01.nc', 'aod_500nm_2014-02.nc', 'aod_500nm_2014-03.nc', 'aod_500nm_2014-04.nc',
  'aod_500nm_2014-05.nc', 'aod_500nm_2014-06.nc', 'aod_500nm_2014-07.nc', 'aod_500nm_2014-08.nc',
  'aod_500nm_2014-09.nc', 'aod_500nm_2014-10.nc', 'aod_500nm_2014-11.nc', 'aod_500nm_2014-12.nc',
];

export const Vertical = () => (
  <ScrollArea type="always" className="rounded-md border" style={{ height: 220, width: 320 }}>
    <div className="p-4">
      <h4 className="mb-4 text-sm font-medium text-primary-900">GoAmazon 2014/5 · version 3</h4>
      {files.map((name, i) => (
        <div key={name}>
          {i > 0 && <Separator style={{ margin: '8px 0' }} />}
          <div className="text-sm font-mono text-primary-700">{name}</div>
        </div>
      ))}
    </div>
  </ScrollArea>
);

export const Horizontal = () => (
  <ScrollArea type="always" className="rounded-md border" style={{ width: 360 }}>
    <div className="flex gap-2 p-4" style={{ width: 'max-content' }}>
      {['LAPAT', 'GoAmazon', 'ATTO', 'SAMBBA', 'CHUVA', 'Green Ocean', 'MetroCity SP'].map((t) => (
        <span key={t} className="text-xs text-primary-700 bg-primary-100 px-2 py-1 rounded whitespace-nowrap">{t}</span>
      ))}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
);
