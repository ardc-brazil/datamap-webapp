import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, ScrollArea, Button, MaterialSymbol } from '@datamap/ui';


export const OutlineCancel = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Discard upload</DialogTitle>
        <DialogDescription>
          3 of 12 files (aod_500nm_2014-03.nc, aod_500nm_2014-04.nc, metadata.csv) have not finished uploading.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Keep uploading</Button>
        </DialogClose>
        <Button variant="destructive">Discard</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
