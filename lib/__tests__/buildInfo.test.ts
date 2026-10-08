import { describe, expect, test } from '@jest/globals';
import { formatLongDate, shortCommit } from "../buildInfo";

describe("shortCommit", () => {
    test("uses BUILD_COMMIT when it is set, cut to 7 characters", () => {
        expect(shortCommit({ BUILD_COMMIT: "0123456789abcdef" })).toBe("0123456");
    });

    test("falls back to a name that says it is not a commit", () => {
        expect(shortCommit({}, () => { throw new Error("no git"); })).toBe("sem-commit");
    });

    test("asks git when there is no BUILD_COMMIT", () => {
        expect(shortCommit({}, () => "abc1234\n")).toBe("abc1234");
    });
});

describe("formatLongDate", () => {
    test("writes the date in Portuguese", () => {
        expect(formatLongDate(new Date("2026-10-08T15:00:00Z"))).toBe("8 de outubro de 2026");
    });
});
