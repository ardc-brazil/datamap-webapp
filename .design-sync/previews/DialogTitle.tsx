import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, ScrollArea, Button, MaterialSymbol } from '@datamap/ui';

const versions = [
  { name: '5', when: '2 days ago', updated: 'Updated 2026-10-06', doi: '10.5072/datamap.4821.v5' },
  { name: '4', when: '3 weeks ago', updated: 'Updated 2026-09-15', doi: '10.5072/datamap.4821.v4' },
  { name: '3', when: '2 months ago', updated: 'Updated 2026-08-11', doi: '10.5072/datamap.4821.v3' },
  { name: '2', when: '4 months ago', updated: 'Updated 2026-06-02', doi: '10.5072/datamap.4821.v2' },
  { name: '1', when: 'a year ago', updated: 'Initial release', doi: '10.5072/datamap.4821.v1' },
];

const VersionItem = ({ v }: { v: (typeof versions)[number] }) => (
  <li className="border-b border-b-primary-200 p-4 flex flex-row items-center h-full hover:bg-primary-100 cursor-pointer gap-4">
    <div className="flex items-center justify-center h-14 w-14">
      <MaterialSymbol icon="stacks" size={48} weight={200} grade={-25} className="px-1" />
    </div>
    <div className="w-full flex flex-col">
      <div className="flex flex-row justify-between">
        <span className="text-base font-body text-primary-900">Version {v.name}</span>
        <span className="text-xs font-body">{v.when}</span>
      </div>
      <div className="flex flex-row items-center justify-start gap-2">
        <span className="text-xs">{v.updated}</span>
        <span>·</span>
        <span className="text-xs">doi: {v.doi}</span>
      </div>
    </div>
  </li>
);

export const HistoryTitle = () => (
  <Dialog open>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>History</DialogTitle>
      </DialogHeader>
      <ScrollArea className="w-full" style={{ height: 260 }}>
        <ul>
          {versions.map((v) => (
            <VersionItem key={v.name} v={v} />
          ))}
        </ul>
      </ScrollArea>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
