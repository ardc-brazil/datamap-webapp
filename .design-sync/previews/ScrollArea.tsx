import { ScrollArea, ScrollBar, Separator, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@datamap/ui';

const extensions = [
  { ext: '.nc', count: 11872 },
  { ext: '.csv', count: 412 },
  { ext: '.json', count: 96 },
  { ext: '.txt', count: 54 },
  { ext: '.png', count: 31 },
  { ext: '.pdf', count: 9 },
  { ext: '.zip', count: 6 },
];
const files = [
  'aod_500nm_2014-01.nc', 'aod_500nm_2014-02.nc', 'aod_500nm_2014-03.nc', 'aod_500nm_2014-04.nc',
  'aod_500nm_2014-05.nc', 'aod_500nm_2014-06.nc', 'aod_500nm_2014-07.nc', 'aod_500nm_2014-08.nc',
  'aod_500nm_2014-09.nc', 'aod_500nm_2014-10.nc', 'aod_500nm_2014-11.nc', 'aod_500nm_2014-12.nc',
];

export const ExtensionBreakdown = () => (
  <Card className="min-w-[240px]" style={{ width: 300 }}>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Extension</TableHead>
          <TableHead className="text-right">Count</TableHead>
        </TableRow>
      </TableHeader>
    </Table>
    <ScrollArea type="always" className="h-[120px] w-full">
      <Table>
        <TableBody>
          {extensions.map((e) => (
            <TableRow key={e.ext}>
              <TableCell className="font-medium">
                <span className="text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded">{e.ext}</span>
              </TableCell>
              <TableCell className="text-right">{e.count.toLocaleString()} files</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  </Card>
);

export const FileList = () => (
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
