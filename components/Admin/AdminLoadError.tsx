import { ADMIN_COPY } from "../../contants/AdminConstants";

interface Props {
    message: string
    onRetry(): void
}

export function AdminLoadError({ message, onRetry }: Props) {
    return (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
            <span>{message}</span>
            <button type="button" onClick={onRetry} className="text-[13px] font-semibold underline underline-offset-2">{ADMIN_COPY.retry}</button>
        </div>
    );
}
