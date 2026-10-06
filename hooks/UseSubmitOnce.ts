import { useCallback, useRef, useState } from "react";

type Phase = "idle" | "busy" | "done";

export interface SubmitOnce {
    submit(action: () => Promise<unknown>): Promise<void>
    reset(): void
    busy: boolean
    done: boolean
}

export function useSubmitOnce(): SubmitOnce {
    const phase = useRef<Phase>("idle");
    const [shown, setShown] = useState<Phase>("idle");

    const move = useCallback((next: Phase) => {
        phase.current = next;
        setShown(next);
    }, []);

    const submit = useCallback(async (action: () => Promise<unknown>) => {
        if (phase.current !== "idle") {
            return;
        }
        move("busy");
        try {
            await action();
        } catch (error) {
            move("idle");
            throw error;
        }
        move("done");
    }, [move]);

    const reset = useCallback(() => move("idle"), [move]);

    return { submit, reset, busy: shown === "busy", done: shown === "done" };
}
