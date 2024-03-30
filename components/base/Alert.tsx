
interface AlertInitialStatus {
    show?: boolean;
}

interface AlertProps {
    children: any;
    callout?: string;
    closed?(): void;
    initialStatus?: AlertInitialStatus;
    show?: boolean
}

export default function Alert(props: AlertProps) {
    function closeHandler() {
        if (props.closed) {
            props.closed();
        }
        return false;
    }

    if (props.show) {
        return (

            <div className="h-fit text-primary-50 px-6 py-4 border-0 rounded relative mb-4 bg-secondary-500 z-0 mt-4">
                <span className="inline-block align-middle mr-8 text-primary-900">
                    {props.callout &&
                        <b className="capitalize">{props.callout}</b>
                    } {props.children}
                </span>
                <button
                    type="button"
                    className="absolute bg-transparent text-2xl font-semibold leading-none right-0 top-0 mt-4 mr-6 outline-none focus:outline-none text-primary-900"
                    onClick={closeHandler}>
                    <span>×</span>
                </button>
            </div>

        )
    } else {
        return <></>
    }
}
