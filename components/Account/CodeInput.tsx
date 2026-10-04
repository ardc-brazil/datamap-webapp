import { ClipboardEvent, KeyboardEvent, useRef } from "react";
import { CODE_LENGTH } from "../../contants/AccountConstants";

interface Props {
    value: string
    onChange: (value: string) => void
    onComplete: (code: string) => void
    disabled?: boolean
    invalid?: boolean
    describedBy?: string
}

const BOX_CLASS = "w-10 h-12 p-0 text-center text-xl font-semibold font-mono text-primary-900 bg-primary-0 border rounded-md disabled:opacity-60";

export function CodeInput({ value, onChange, onComplete, disabled, invalid, describedBy }: Props) {
    const boxes = useRef<(HTMLInputElement | null)[]>([]);
    // Focus moves before the parent re-renders with the new value, so the boxes read the length from here.
    const filled = useRef(value.length);
    filled.current = value.length;
    const digits = Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? "");

    function focusBox(index: number) {
        boxes.current[Math.max(0, Math.min(CODE_LENGTH - 1, index))]?.focus();
    }

    function update(next: string, focusIndex: number) {
        filled.current = next.length;
        onChange(next);
        focusBox(focusIndex);
        if (next.length === CODE_LENGTH) {
            onComplete(next);
        }
    }

    function fillFrom(index: number, typed: string) {
        const next = (value.slice(0, index) + typed + value.slice(index + typed.length)).slice(0, CODE_LENGTH);
        update(next, index + typed.length);
    }

    function onBoxChange(index: number, raw: string) {
        const typed = raw.replace(/\D/g, "");
        if (!typed) {
            return;
        }
        const previous = digits[index];
        // A box that kept its digit receives it again next to the new one; only the new one counts.
        if (previous && typed.length === 2) {
            fillFrom(index, typed[0] === previous ? typed[1] : typed[0]);
        } else {
            fillFrom(index, typed);
        }
    }

    function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Backspace") {
            event.preventDefault();
            if (digits[index]) {
                const next = value.slice(0, index) + value.slice(index + 1);
                filled.current = next.length;
                onChange(next);
            } else {
                focusBox(index - 1);
            }
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            focusBox(index - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            focusBox(index + 1);
        }
    }

    function onPaste(event: ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
        if (pasted) {
            update(pasted, pasted.length);
        }
    }

    return (
        <div role="group" aria-label="Verification code" aria-describedby={describedBy} className="flex gap-2">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(element) => { boxes.current[index] = element; }}
                    value={digit}
                    onChange={(event) => onBoxChange(index, event.target.value)}
                    onKeyDown={(event) => onKeyDown(index, event)}
                    onPaste={onPaste}
                    onFocus={(event) => {
                        if (index > filled.current) {
                            focusBox(filled.current);
                        } else {
                            event.target.select();
                        }
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
                    aria-invalid={invalid ? true : undefined}
                    disabled={disabled}
                    className={`${BOX_CLASS} ${invalid ? "border-error-500" : "border-primary-300"}`}
                />
            ))}
        </div>
    );
}
