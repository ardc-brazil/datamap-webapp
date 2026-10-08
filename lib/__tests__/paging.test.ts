import { describe, expect, test } from "@jest/globals";
import { lastPageOffset } from "../paging";

describe("lastPageOffset", () => {
    test("is the offset of the page holding the last item", () => {
        expect(lastPageOffset(120, 50)).toBe(100);
    });

    test("a full last page starts one limit before the total", () => {
        expect(lastPageOffset(100, 50)).toBe(50);
    });

    test("a single page starts at zero", () => {
        expect(lastPageOffset(1, 50)).toBe(0);
    });

    test("an empty list starts at zero", () => {
        expect(lastPageOffset(0, 50)).toBe(0);
    });
});
