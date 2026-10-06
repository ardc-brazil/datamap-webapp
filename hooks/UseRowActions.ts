import { useRef, useState } from "react";
import { tenancyErrorMessage } from "../contants/TenancyConstants";

const GONE_DETAILS = new Set(["invitation_not_found", "request_not_found"]);

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
    const { [key]: _removed, ...rest } = record;
    return rest;
}

export function useRowActions(revalidate: () => Promise<unknown>) {
    const runningRef = useRef<Set<string>>(new Set());
    const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    async function revalidateQuietly() {
        try {
            await revalidate();
        } catch (e) {
            console.error("Refreshing the list failed", e);
        }
    }

    async function run(id: string, action: () => Promise<void>): Promise<void> {
        if (runningRef.current.has(id)) {
            return;
        }
        runningRef.current.add(id);
        setBusyIds((previous) => ({ ...previous, [id]: true }));
        setErrors((previous) => withoutKey(previous, id));
        try {
            await action();
            await revalidateQuietly();
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            setErrors((previous) => ({ ...previous, [id]: tenancyErrorMessage(detail) }));
            if (GONE_DETAILS.has(detail)) {
                await revalidateQuietly();
            }
        } finally {
            runningRef.current.delete(id);
            setBusyIds((previous) => withoutKey(previous, id));
        }
    }

    return {
        run,
        busy: (id: string) => !!busyIds[id],
        error: (id: string): string | undefined => errors[id],
    };
}
