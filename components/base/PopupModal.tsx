import { MaterialSymbol } from "react-material-symbols";

interface ModalProps {
  confimButtonText: string;
  cancelButtonText?: string;
  confim?(): void;
  cancel?(): void;
  children: any;
  title: string;
  show?: Boolean
  noPaddingContent?: boolean
  destructive?: boolean
  maxWidthClassName?: string
}

export default function Modal(props: ModalProps) {

  if (!props.show) {
    return null;
  }

  const confirmColors = props.destructive
    ? "bg-error-600 hover:bg-error-700 text-primary-0"
    : "bg-primary-900 hover:bg-primary-800 text-primary-50";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-primary-900/40" aria-hidden="true"></div>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 outline-none focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-modal-title"
      >
        <div className={`relative flex flex-col w-full ${props.maxWidthClassName ?? "max-w-lg"} max-h-[calc(100vh-2rem)] bg-primary-0 border border-primary-200 rounded-lg shadow-xl shadow-primary-900/10 outline-none focus:outline-none`}>
          <div className="flex flex-none items-center justify-between gap-4 pl-5 pr-3 py-3.5 border-b border-primary-200">
            <h3 id="popup-modal-title" className="m-0 text-lg leading-7 font-semibold tracking-[-0.01em] text-primary-900">
              {props.title}
            </h3>
            <button
              type="button"
              aria-label="Close"
              className="flex items-center justify-center h-8 w-8 rounded-md text-primary-500 hover:bg-primary-100 hover:text-primary-900 transition-colors"
              onClick={() => props.cancel()}
            >
              <MaterialSymbol icon="close" size={20} grade={-25} weight={400} />
            </button>
          </div>
          <div className={`relative flex-auto min-h-0 overflow-y-auto text-sm leading-5 text-primary-700 ${props.noPaddingContent ? "" : "px-5 py-4"}`}>
            {props.children}
          </div>
          <div className="flex flex-none items-center justify-end gap-2 px-5 py-3 border-t border-primary-200">
            <button
              className="h-9 px-3.5 rounded-md border border-primary-300 bg-primary-0 text-primary-900 text-[13px] font-semibold whitespace-nowrap hover:bg-primary-100 transition-colors"
              type="button"
              onClick={() => props.cancel()}
            >
              {!props.cancelButtonText ? "Close" : props.cancelButtonText}
            </button>
            {props.confim &&
              <button
                className={`h-9 px-3.5 rounded-md text-[13px] font-semibold whitespace-nowrap transition-colors ${confirmColors}`}
                type="button"
                onClick={() => props.confim()}
              >
                {props.confimButtonText}
              </button>
            }
          </div>
        </div>
      </div>
    </>
  );
}
