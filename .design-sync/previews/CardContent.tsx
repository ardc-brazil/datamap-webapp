import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Badge } from '@datamap/ui';

export const DatasetSummary = () => (
  <Card style={{ width: 380 }}>
    <CardHeader>
      <CardTitle>GoAmazon 2014/5 — aerosol optical depth</CardTitle>
      <CardDescription>Manacapuru site T3 · version 2.1</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-3 text-sm text-primary-700">
      <p>Hourly AOD at 500 nm from the AERONET sun photometer, quality level 2.0, covering the wet and dry seasons of the campaign.</p>
      <div className="flex items-center gap-2">
        <Badge variant="outline">.nc</Badge>
        <Badge variant="outline">.csv</Badge>
        <Badge variant="secondary">Public</Badge>
      </div>
    </CardContent>
  </Card>
);
