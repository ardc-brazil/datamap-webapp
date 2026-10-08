import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, ScrollArea, Button, MaterialSymbol } from '@datamap/ui';

const DatasetPage = ({ children }: { children?: React.ReactNode }) => (
  <div style={{ padding: 32, width: 720 }} className="flex flex-col gap-2">
    <span className="text-xs text-primary-500">LAPAT / production / atmosphere</span>
    {children ?? <h1 className="text-3xl font-semibold text-primary-900">Version 3</h1>}
    <p className="text-sm text-primary-700">
      GoAmazon 2014/5 aerosol optical depth · hourly AOD at 500 nm from the Manacapuru T3 sun photometer.
    </p>
    <p className="text-sm text-primary-600">12,480 files · 48.2 GB · doi: 10.5072/datamap.4821.v3</p>
  </div>
);

export const PortalledContent = () => (
  <>
    <DatasetPage />
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish version 3</DialogTitle>
          <DialogDescription>
            GoAmazon 2014/5 aerosol optical depth will be minted as DOI 10.5072/datamap.4821.v3.
            Published versions are permanent and cannot be edited afterwards.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Publish version</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);
