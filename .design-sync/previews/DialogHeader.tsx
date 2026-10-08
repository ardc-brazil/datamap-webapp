import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, ScrollArea, Button, MaterialSymbol } from '@datamap/ui';


export const TitleAndDescription = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Request access to LAPAT</DialogTitle>
        <DialogDescription>
          A tenancy administrator reviews every request. You will be notified by e-mail once
          it is approved and the LAPAT datasets appear in your list.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button>Send request</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
