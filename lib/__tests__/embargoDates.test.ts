import { describe, expect, test } from '@jest/globals';
import {
    embargoRequestFrom,
    formatEmbargoDate,
    maxEmbargoDate,
    minEmbargoDate,
    minExtensionDate,
    toEmbargoUntil,
    validateEmbargoDate,
} from "../embargoDates";

const NOW = new Date("2026-09-30T10:00:00Z");

describe('embargo dates', () => {
    test('the earliest date is tomorrow', () => {
        expect(minEmbargoDate(NOW)).toBe("2026-10-01");
    });

    test('the latest date ends before now plus 90 days, so the server never refuses it', () => {
        const max = maxEmbargoDate(NOW);
        expect(max).toBe("2026-12-28");
        const endOfMax = new Date(toEmbargoUntil(max)).getTime();
        expect(endOfMax).toBeLessThanOrEqual(NOW.getTime() + 90 * 24 * 60 * 60 * 1000);
    });

    test('the latest date holds just before midnight too', () => {
        const lateNow = new Date("2026-09-30T23:59:59Z");
        const endOfMax = new Date(toEmbargoUntil(maxEmbargoDate(lateNow))).getTime();
        expect(endOfMax).toBeLessThanOrEqual(lateNow.getTime() + 90 * 24 * 60 * 60 * 1000);
    });

    test('until is the end of the chosen UTC day', () => {
        expect(toEmbargoUntil("2026-12-01")).toBe("2026-12-01T23:59:59+00:00");
    });

    test('an extension starts the day after the current end', () => {
        expect(minExtensionDate("2026-10-10T23:59:59+00:00", NOW)).toBe("2026-10-11");
    });

    test('an extension never starts before tomorrow', () => {
        expect(minExtensionDate("2026-09-01T23:59:59+00:00", NOW)).toBe("2026-10-01");
    });

    test.each([
        ["", "Required"],
        ["2026-09-30", "Choose a date after today."],
        ["2026-12-29", "An embargo can last at most 90 days."],
    ])('%s is refused with "%s"', (date, message) => {
        expect(validateEmbargoDate(date, NOW)).toBe(message);
    });

    test('a date inside the window is accepted', () => {
        expect(validateEmbargoDate("2026-12-28", NOW)).toBeUndefined();
    });

    test('a custom minimum is honoured', () => {
        expect(validateEmbargoDate("2026-10-05", NOW, "2026-10-11")).toBe("Choose a date after the current end of the embargo.");
    });

    test('dates are shown as a day, in UTC', () => {
        expect(formatEmbargoDate("2026-12-28T23:59:59+00:00")).toBe("December 28, 2026");
    });
});

describe('embargoRequestFrom', () => {
    test('no embargo builds no request', () => {
        expect(embargoRequestFrom({ embargoMode: "none", embargoUntil: "2026-12-01" })).toBeNull();
        expect(embargoRequestFrom({})).toBeNull();
    });

    test('open mode makes the metadata visible', () => {
        expect(embargoRequestFrom({ embargoMode: "open", embargoUntil: "2026-12-01" })).toEqual({
            until: "2026-12-01T23:59:59+00:00",
            metadata_visible: true,
            note: null,
        });
    });

    test('hidden mode keeps the metadata hidden', () => {
        expect(embargoRequestFrom({ embargoMode: "hidden", embargoUntil: "2026-12-01" })?.metadata_visible).toBe(false);
    });
});
