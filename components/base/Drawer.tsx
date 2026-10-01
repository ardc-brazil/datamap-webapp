import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";

interface DrawerProps {
    title: string;
    children: any;
    show: any;
    showCloseButton: boolean;
    showCreateButton: boolean;
    showClearAllButton: boolean;

    onClose(): unknown;
    onCreate(): unknown;
    onClearAll(): unknown;
    onOpen(): unknown;
}

const OUTLINE_BUTTON_CLASS = "h-9 px-3.5 rounded-md border border-primary-300 bg-primary-0 text-primary-900 text-[13px] font-semibold whitespace-nowrap hover:bg-primary-100 transition-colors disabled:opacity-50";
const PRIMARY_BUTTON_CLASS = "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary-900 text-primary-50 text-[13px] font-semibold whitespace-nowrap hover:bg-primary-800 transition-colors disabled:opacity-50";

export default function Drawer(props: DrawerProps) {

    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        props?.onOpen()
        document.body.style.overflow = props?.show ? 'hidden' : '';
    }, [props.show]);


    if (!props?.show) {
        return null;
    }

    return <div className="relative z-[1005] overscroll-none" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-primary-900/40 transition-opacity" aria-hidden="true"></div>
        <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div className="pointer-events-auto relative w-screen max-w-screen-md">
                        <div className="flex h-full flex-col bg-primary-0 border-l border-primary-200 shadow-xl">

                            <div className="flex flex-none items-center justify-between gap-4 h-16 pl-6 pr-4 border-b border-primary-200">
                                <h2 className="m-0 text-lg leading-7 font-semibold tracking-[-0.01em] text-primary-900" id="slide-over-title">{props.title}</h2>
                                <button
                                    type="button"
                                    aria-label="Close"
                                    className="flex items-center justify-center h-8 w-8 rounded-md text-primary-500 hover:bg-primary-100 hover:text-primary-900 transition-colors"
                                    onClick={props.onClose}
                                >
                                    <MaterialSymbol icon="close" grade={-25} size={20} weight={400} />
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
                                {props.children}
                            </div>

                            <div className="flex flex-none justify-end items-center gap-2 h-16 px-6 border-t border-primary-200 bg-primary-0">
                                {props.showClearAllButton &&
                                    <button
                                        type="button"
                                        className={OUTLINE_BUTTON_CLASS}
                                        onClick={props.onClearAll}
                                        disabled={submitting}>
                                        Clear all
                                    </button>
                                }
                                {props.showCreateButton &&
                                    <button
                                        type="button"
                                        className={PRIMARY_BUTTON_CLASS}
                                        onClick={() => { setSubmitting(true); props.onCreate() }}
                                        disabled={submitting}>
                                        {submitting &&
                                            <MaterialSymbol icon="progress_activity" size={18} grade={-25} weight={400}
                                                className="animate-spin"
                                            />
                                        }
                                        Create
                                    </button>
                                }
                                {props.showCloseButton &&
                                    <button type="button" className={OUTLINE_BUTTON_CLASS} onClick={props.onClose}>Close</button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>;
}
