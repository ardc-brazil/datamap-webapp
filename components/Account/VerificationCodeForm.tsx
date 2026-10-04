import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { CODE_LENGTH, RESEND_COOLDOWN_SECONDS, accountErrorMessage } from "../../contants/AccountConstants";
import { CodeInput } from "./CodeInput";

interface Props {
    email: string
    onSubmit: (code: string) => Promise<void>
    onResend: () => Promise<void>
}

function detailOf(error: unknown): string | undefined {
    return (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
}

// One auto-submitting field: Formik's submitForm reads the values of the last render, so the code is passed directly.
export function VerificationCodeForm({ email, onSubmit, onResend }: Props) {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
    const [resending, setResending] = useState(false);
    const [focusKey, setFocusKey] = useState(0);
    const counting = secondsLeft > 0;
    const errorId = useId();
    // Some mobile WebViews double-fire the autofill input: two onComplete calls can land with
    // the same code before a re-render, so the guard can't rely on submitting state alone.
    const submittingRef = useRef(false);

    useEffect(() => {
        if (!counting) {
            return;
        }
        const timer = setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => clearInterval(timer);
    }, [counting]);

    async function submit(value: string) {
        if (submittingRef.current || value.length !== CODE_LENGTH) {
            return;
        }
        submittingRef.current = true;
        setSubmitting(true);
        setError(null);
        setNotice(null);
        try {
            await onSubmit(value);
        } catch (e) {
            setError(accountErrorMessage(detailOf(e)));
            setCode("");
            setFocusKey((key) => key + 1);
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    }

    async function resend() {
        setResending(true);
        setError(null);
        setNotice(null);
        try {
            await onResend();
            setCode("");
            setNotice(`We sent a new code to ${email}.`);
            setSecondsLeft(RESEND_COOLDOWN_SECONDS);
        } catch (e) {
            setError(accountErrorMessage(detailOf(e)));
        } finally {
            setResending(false);
        }
    }

    function onFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        submit(code);
    }

    return (
        <form onSubmit={onFormSubmit} className="flex flex-col gap-4">
            <p className="m-0 text-sm text-primary-700">
                We sent a {CODE_LENGTH}-digit code to <span className="font-semibold text-primary-900">{email}</span>. It can take up to a minute to arrive and expires in 15 minutes.
            </p>
            <CodeInput value={code} onChange={setCode} onComplete={submit} disabled={submitting} invalid={error !== null} describedBy={error ? errorId : undefined} autoFocusKey={focusKey} />
            {error && <p role="alert" id={errorId} className="m-0 text-sm text-error-600">{error}</p>}
            {notice && <p role="status" className="m-0 text-sm text-primary-700">{notice}</p>}
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="btn-primary m-0" disabled={submitting || code.length !== CODE_LENGTH}>
                    {submitting ? "Checking…" : "Confirm"}
                </button>
                <button type="button" className="btn-primary-outline m-0" disabled={counting || resending} onClick={resend}>
                    {counting ? `Resend code in ${secondsLeft}s` : "Resend code"}
                </button>
            </div>
        </form>
    );
}
