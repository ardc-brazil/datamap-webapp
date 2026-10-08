import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Badge } from '@datamap/ui';

export const DatasetActions = () => (
  <Card style={{ width: 380 }}>
    <CardHeader>
      <CardTitle>LAPAT CO₂ flux tower</CardTitle>
      <CardDescription>version 3 · updated 3 days ago</CardDescription>
    </CardHeader>
    <CardFooter className="gap-2">
      <Button size="sm">Open dataset</Button>
      <Button size="sm" variant="outline">Cite</Button>
    </CardFooter>
  </Card>
);

export const StatFooter = () => (
  <Card className="w-52">
    <CardHeader>
      <CardDescription>Files</CardDescription>
      <CardTitle className="text-3xl font-semibold tabular-nums">12,480</CardTitle>
    </CardHeader>
    <CardFooter className="flex-col items-start gap-1.5 text-sm">
      <div className="line-clamp-1 flex gap-2 text-muted-foreground">Total number of files</div>
    </CardFooter>
  </Card>
);
