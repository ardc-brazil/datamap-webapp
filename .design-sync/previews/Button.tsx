import { Button, MaterialSymbol } from '@datamap/ui';

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Create dataset</Button>
    <Button variant="outline">Cancel</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="ghost">Skip</Button>
    <Button variant="destructive">Delete version</Button>
    <Button variant="link">View history</Button>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm">Small</Button>
    <Button>Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" variant="outline" aria-label="Search">
      <MaterialSymbol icon="search" size={18} weight={200} grade={-25} />
    </Button>
  </div>
);

export const WithIcon = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>
      <MaterialSymbol icon="upload_file" size={18} weight={200} grade={-25} />
      Upload files
    </Button>
    <Button variant="outline">
      <MaterialSymbol icon="download" size={18} weight={200} grade={-25} />
      Download snapshot
    </Button>
  </div>
);

export const Disabled = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button disabled>Publishing…</Button>
    <Button variant="outline" disabled>Cancel</Button>
  </div>
);
