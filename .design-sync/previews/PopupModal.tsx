import { PopupModal } from '@datamap/ui';

const noop = () => {};

// PopupModal is position: fixed; a transformed parent makes the cell its containing block.
const Stage = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', height: 400, width: 640, transform: 'translateZ(0)' }}>{children}</div>
);

export const Confirm = () => (
  <Stage>
  <PopupModal
    title="Extend embargo"
    show
    confimButtonText="Extend to 12 Mar 2027"
    cancelButtonText="Cancel"
    cancel={noop}
    confim={noop}
    maxWidthClassName="max-w-[440px]"
  >
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[13px] text-primary-500">Ends 12 Dec 2026</p>
      <ul className="m-0 pl-4 list-disc text-[13px] text-primary-700 space-y-1">
        <li>Files stay restricted to people with access</li>
        <li>The DOI stays reserved until the embargo ends</li>
      </ul>
    </div>
  </PopupModal>
  </Stage>
);

export const Destructive = () => (
  <Stage>
  <PopupModal
    title="End embargo now?"
    show
    destructive
    confimButtonText="End embargo"
    cancelButtonText="Keep embargo"
    cancel={noop}
    confim={noop}
    maxWidthClassName="max-w-[440px]"
  >
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[13px] text-primary-500">Set to end 12 Dec 2026 · can&apos;t be undone</p>
      <ul className="m-0 pl-4 list-disc text-[13px] text-primary-700 space-y-1">
        <li>Files open to LAPAT members now</li>
        <li>Nothing becomes public until the DOI is promoted</li>
        <li>3 people with access are emailed</li>
      </ul>
    </div>
  </PopupModal>
  </Stage>
);

export const InfoOnly = () => (
  <Stage>
  <PopupModal
    title="Only the owner can do this"
    show
    confimButtonText=""
    cancelButtonText="Close"
    cancel={noop}
    maxWidthClassName="max-w-[440px]"
  >
    <p className="m-0 text-[13px] text-primary-700">
      Ask the dataset owner to register the DOI manually before publishing this version.
    </p>
  </PopupModal>
  </Stage>
);
