import { MAX_EMBARGO_DAYS } from "../contants/EmbargoConstants";
import { SetEmbargoRequest } from "../types/GatekeeperAPI";

export type EmbargoMode = "none" | "open" | "hidden";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function minEmbargoDate(now: Date): string {
    return toDateInputValue(new Date(now.getTime() + DAY_MS));
}

// 89, not 90: the chosen day ends at 23:59:59, which must stay within now + 90 days.
export function maxEmbargoDate(now: Date): string {
    return toDateInputValue(new Date(now.getTime() + (MAX_EMBARGO_DAYS - 1) * DAY_MS));
}

export function minExtensionDate(currentUntil: string, now: Date): string {
    const dayAfterCurrent = toDateInputValue(new Date(new Date(currentUntil).getTime() + DAY_MS));
    const tomorrow = minEmbargoDate(now);
    return dayAfterCurrent > tomorrow ? dayAfterCurrent : tomorrow;
}

export function toEmbargoUntil(dateInput: string): string {
    return `${dateInput}T23:59:59+00:00`;
}

export function validateEmbargoDate(dateInput: string, now: Date, min?: string): string | undefined {
    if (!dateInput) {
        return "Required";
    }
    if (min && dateInput < min) {
        return "Choose a date after the current end of the embargo.";
    }
    if (dateInput < minEmbargoDate(now)) {
        return "Choose a date after today.";
    }
    if (dateInput > maxEmbargoDate(now)) {
        return `An embargo can last at most ${MAX_EMBARGO_DAYS} days.`;
    }
    return undefined;
}

export function formatEmbargoDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

export function embargoRequestFrom(values: { embargoMode?: EmbargoMode, embargoUntil?: string }): SetEmbargoRequest | null {
    if (!values.embargoMode || values.embargoMode === "none") {
        return null;
    }
    return {
        until: toEmbargoUntil(values.embargoUntil as string),
        metadata_visible: values.embargoMode === "open",
        note: null,
    };
}
