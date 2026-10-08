import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Badge } from '@datamap/ui';

export const DatasetHeader = () => (
  <Card style={{ width: 380 }}>
    <CardHeader>
      <CardTitle>LAPAT CO₂ flux tower</CardTitle>
      <CardDescription>Eddy covariance, 30-min fluxes · version 3 · doi: 10.5072/datamap.4821</CardDescription>
    </CardHeader>
  </Card>
);

export const StatHeader = () => (
  <Card className="w-52">
    <CardHeader>
      <CardDescription>Files</CardDescription>
      <CardTitle className="text-3xl font-semibold tabular-nums">12,480</CardTitle>
    </CardHeader>
  </Card>
);
