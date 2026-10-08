import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, ScrollArea, Button, MaterialSymbol } from '@datamap/ui';


export const CancelAndConfirm = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Remove collaborator</DialogTitle>
        <DialogDescription>
          Marina Okuyama will lose access to LAPAT CO₂ flux tower and its 14 embargoed .nc files.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button variant="destructive">Remove access</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
