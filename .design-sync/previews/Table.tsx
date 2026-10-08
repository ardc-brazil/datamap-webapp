import { Card, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Badge } from '@datamap/ui';

const breakdown = [
  { extension: '.nc', count: 11872 },
  { extension: '.csv', count: 512 },
  { extension: '.json', count: 64 },
  { extension: '.txt', count: 32 },
];

export const ExtensionBreakdown = () => (
  <Card className="min-w-[240px]" style={{ width: 280 }}>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Extension</TableHead>
          <TableHead className="text-right">Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {breakdown.map((file) => (
          <TableRow key={file.extension}>
            <TableCell className="font-medium">
              <span className="text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded">{file.extension}</span>
            </TableCell>
            <TableCell className="text-right">{file.count.toLocaleString()} files</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

const files = [
  { name: 'goamazon_t3_aod_20140115.nc', size: '4.2 MB', status: 'Public' },
  { name: 'goamazon_t3_aod_20140116.nc', size: '4.1 MB', status: 'Public' },
  { name: 'goamazon_t3_aod_20150302.nc', size: '3.9 MB', status: 'Embargoed' },
  { name: 'station_metadata.csv', size: '18 KB', status: 'Public' },
];

export const DatasetFiles = () => (
  <div style={{ width: 560 }}>
    <Table>
      <TableCaption>GoAmazon 2014/5 aerosol optical depth · version 2.1</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Access</TableHead>
          <TableHead className="text-right">Size</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((f) => (
          <TableRow key={f.name}>
            <TableCell className="font-medium text-primary-900">{f.name}</TableCell>
            <TableCell>
              <Badge variant={f.status === 'Public' ? 'secondary' : 'outline'}>{f.status}</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{f.size}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>4 of 12,480 files</TableCell>
          <TableCell className="text-right tabular-nums">12.2 MB</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  </div>
);
