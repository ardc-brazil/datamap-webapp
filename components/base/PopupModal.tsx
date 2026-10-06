import { ReactNode, useId } from "react";
import { MaterialSymbol } from "react-material-symbols";

interface ModalProps {
  confimButtonText?: string;
  cancelButtonText?: string;
  confim?(): void;
  cancel?(): void;
  children?: any;
  title: string;
  subtitle?: ReactNode;
  show?: Boolean
  noPaddingContent?: boolean
  destructive?: boolean
  danger?: boolean
  maxWidthClassName?: string
  hideCancel?: boolean
  confirmDisabled?: boolean
  cancelDisabled?: boolean
  closeAriaLabel?: string
  footerLink?: { label: string; onClick(): void }
  variant?: "default" | "xl"
}

const FRAMES = {
  default: {
    card: "rounded-lg shadow-xl shadow-primary-900/10",
    header: "items-center pl-5 pr-3 py-3.5 border-b border-primary-200",
    body: "px-5 py-4",
    footer: "px-5 py-3",
    disabled: "disabled:opacity-50",
  },
  xl: {
    card: "rounded-xl shadow-2xl shadow-primary-900/20",
    header: "items-start px-6 pt-5 pb-4",
    body: "flex flex-col gap-4 px-6 pb-5",
    footer: "px-6 py-4",
    disabled: "disabled:bg-primary-200 disabled:text-primary-400",
  },
};

function confirmColorsOf(props: ModalProps): string {
  if (props.danger) {
    return "bg-danger-700 hover:bg-danger-800 text-primary-0";
  }
  if (props.destructive) {
    return "bg-error-600 hover:bg-error-700 text-primary-0";
  }
  return "bg-primary-900 hover:bg-primary-800 text-primary-50";
}

export default function Modal(props: ModalProps) {
  const titleId = useId();

  if (!props.show) {
    return null;
  }

  const frame = FRAMES[props.variant ?? "default"];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-primary-900/40" aria-hidden="true"></div>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 outline-none focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={`relative flex flex-col w-full ${props.maxWidthClassName ?? "max-w-lg"} max-h-[calc(100vh-2rem)] bg-primary-0 border border-primary-200 ${frame.card} outline-none focus:outline-none`}>
          <div className={`flex flex-none justify-between gap-4 ${frame.header}`}>
            <div className="min-w-0">
              <h3 id={titleId} className="m-0 text-lg leading-7 font-semibold tracking-[-0.01em] text-primary-900">
                {props.title}
              </h3>
              {props.subtitle && <p className="m-0 mt-1 text-[13px] leading-5 text-primary-500">{props.subtitle}</p>}
            </div>
            <button
              type="button"
              aria-label={props.closeAriaLabel ?? "Close"}
              disabled={props.cancelDisabled}
              className="flex flex-none items-center justify-center h-8 w-8 rounded-md text-primary-500 hover:bg-primary-100 hover:text-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => props.cancel()}
            >
              <MaterialSymbol icon="close" size={20} grade={-25} weight={400} />
            </button>
          </div>
          <div className={`relative flex-auto min-h-0 overflow-y-auto text-sm leading-5 text-primary-700 ${props.noPaddingContent ? "" : frame.body}`}>
            {props.children}
          </div>
          <div className={`flex flex-none items-center justify-end gap-2 border-t border-primary-200 ${frame.footer}`}>
            {props.footerLink &&
              <button
                type="button"
                onClick={() => props.footerLink.onClick()}
                className="mr-auto text-[13px] font-semibold text-danger-700 hover:text-danger-800"
              >
                {props.footerLink.label}
              </button>
            }
            {!props.hideCancel &&
              <button
                className="h-9 px-3.5 rounded-md border border-primary-300 bg-primary-0 text-primary-900 text-[13px] font-semibold whitespace-nowrap hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                disabled={props.cancelDisabled}
                onClick={() => props.cancel()}
              >
                {!props.cancelButtonText ? "Close" : props.cancelButtonText}
              </button>
            }
            {props.confim &&
              <button
                className={`h-9 px-3.5 rounded-md text-[13px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed ${frame.disabled} ${confirmColorsOf(props)}`}
                type="button"
                disabled={props.confirmDisabled}
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
