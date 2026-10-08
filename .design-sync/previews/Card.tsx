import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button } from '@datamap/ui';

export const StatCards = () => (
  <div className="flex gap-4">
    <Card className="w-52">
      <CardHeader>
        <CardDescription>Files</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">12,480</CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 text-muted-foreground">Total number of files</div>
      </CardFooter>
    </Card>
    <Card className="w-52">
      <CardHeader>
        <CardDescription>Storage</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">48.2 GB</CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 text-muted-foreground">Disk space used</div>
      </CardFooter>
    </Card>
  </div>
);

export const WithContent = () => (
  <Card className="w-[380px]">
    <CardHeader>
      <CardTitle>GoAmazon 2014/5 — aerosol optical depth</CardTitle>
      <CardDescription>Manacapuru site T3 · version 2.1 · updated 3 days ago</CardDescription>
    </CardHeader>
    <CardContent className="text-sm text-primary-700">
      Hourly AOD at 500 nm from the AERONET sun photometer, quality level 2.0,
      covering the wet and dry seasons of the campaign.
    </CardContent>
    <CardFooter className="gap-2">
      <Button size="sm">Open dataset</Button>
      <Button size="sm" variant="outline">Cite</Button>
    </CardFooter>
  </Card>
);
