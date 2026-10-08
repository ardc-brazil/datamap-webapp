import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, Button } from '@datamap/ui';

const DatasetPage = ({ children }: { children?: React.ReactNode }) => (
  <div style={{ padding: 32, width: 720 }} className="flex flex-col gap-2">
    <span className="text-xs text-primary-500">LAPAT / production / atmosphere</span>
    <div>{children}</div>
    <p className="text-sm text-primary-700">
      GoAmazon 2014/5 aerosol optical depth · hourly AOD at 500 nm from the Manacapuru T3 sun photometer.
    </p>
    <p className="text-sm text-primary-600">12,480 files · 48.2 GB · doi: 10.5072/datamap.4821.v3</p>
  </div>
);

export const VersionLink = () => (
  <DatasetPage>
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-3xl font-semibold p-0">Version 3</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </DatasetPage>
);
