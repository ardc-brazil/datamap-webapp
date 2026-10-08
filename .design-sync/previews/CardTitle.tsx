import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Badge } from '@datamap/ui';

export const DatasetTitle = () => (
  <Card style={{ width: 380 }}>
    <CardHeader>
      <CardTitle>GoAmazon 2014/5 — aerosol optical depth</CardTitle>
      <CardDescription>Manacapuru site T3 · version 2.1</CardDescription>
    </CardHeader>
  </Card>
);

export const StatTitle = () => (
  <Card className="w-52">
    <CardHeader>
      <CardDescription>Storage</CardDescription>
      <CardTitle className="text-3xl font-semibold tabular-nums">48.2 GB</CardTitle>
    </CardHeader>
  </Card>
);
