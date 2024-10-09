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
        <div className="fixed inset-0 bg-primary-700 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div className="pointer-events-auto relative w-screen max-w-screen-md ">
                        {/* Drawer */}
                        <div className="flex h-full flex-col overflow-y-scroll overscroll-none bg-primary-50 shadow-xl">

                            {/* Header */}
                            <div className="fixed top-0 flex-1 w-full h-16 z-[1005] px-4 py-6 sm:px-6  bg-primary-50 overflow-clip">
                                <div className="flex flex-row space-x-2">
                                    <button type="button" className="flex justify-center items-center" onClick={props.onClose}>
                                        <MaterialSymbol icon="close" grade={-25} size={22} weight={400} />
                                    </button>
                                    <h6 className="font-semibold" id="slide-over-title">{props.title}</h6>
                                </div>
                            </div>
                            {/* Content */}
                            <div className="relative shrink-0 mt-16 mb-16 px-4 sm:px-6 scroll overflow-y-clip overscroll-contain pb-16">
                                {props.children}
                            </div>

                            {/* Footer */}
                            <div className="fixed bottom-0 bg-primary-50 h-16 border-t z-[1005] border-t-primary-200 overscroll-none overflow-clip w-screen max-w-screen-md">
                                <div className="flex justify-end items-center bg-primary-50 h-full px-4 space-x-2">
                                    {props.showClearAllButton &&
                                        <button
                                            className="btn btn-primary-outline"
                                            onClick={props.onClearAll}
                                            disabled={submitting}>
                                            Clear all
                                        </button>
                                    }
                                    {props.showCreateButton &&
                                        <button
                                            className="btn btn-primary gap-2"
                                            onClick={() => { setSubmitting(true); props.onCreate() }}
                                            disabled={submitting}>
                                            {submitting &&
                                                <MaterialSymbol icon="progress_activity" size={22} grade={-25} weight={400}
                                                    className="align-middle animate-spin"
                                                />
                                            }
                                            Create
                                        </button>
                                    }
                                    {props.showCloseButton &&
                                        <button className="btn btn-primary-outline" onClick={props.onClose}>Close</button>
                                    }
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>;
}