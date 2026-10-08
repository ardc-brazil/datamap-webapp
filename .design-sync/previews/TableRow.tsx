import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@datamap/ui';

export const HighlightedRow = () => (
  <div style={{ width: 460 }}>
    <Table>

      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>DOI</TableHead>
          <TableHead className="text-right">Files</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">2.1</TableCell>
          <TableCell>10.5072/datamap.4821</TableCell>
          <TableCell className="text-right tabular-nums">12,480</TableCell>
        </TableRow>
        <TableRow className="bg-muted">
          <TableCell className="font-medium">2.0</TableCell>
          <TableCell>10.5072/datamap.4790</TableCell>
          <TableCell className="text-right tabular-nums">12,301</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">1</TableCell>
          <TableCell>10.5072/datamap.4512</TableCell>
          <TableCell className="text-right tabular-nums">9,876</TableCell>
        </TableRow>
      </TableBody>

    </Table>
  </div>
);
