import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@datamap/ui';

export const VersionHistoryWithTotals = () => (
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
        <TableRow>
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
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>3 versions</TableCell>
          <TableCell className="text-right tabular-nums">34,657</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  </div>
);
