import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, ScrollArea, Button, MaterialSymbol } from '@datamap/ui';


export const ConfirmPublish = () => (
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
);
