import { describe, expect, test } from '@jest/globals';
import { firstNameOf, sessionTenanciesDiffer, tenancyPathLabel, tenancySelectionFor } from "../tenancySelection";

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

describe("which tenancy to work in", () => {
    test("with none, there is nothing to select", () => {
        expect(tenancySelectionFor([])).toEqual({ kind: "none" });
    });

    test("with exactly one, it is selected", () => {
        expect(tenancySelectionFor([PUBLIC])).toEqual({ kind: "only", path: PUBLIC.path });
    });

    test("with more than one, the person chooses", () => {
        expect(tenancySelectionFor([PUBLIC, AMAZON])).toEqual({ kind: "choose" });
    });

    test("a session with the same tenancies in another order is not stale", () => {
        expect(sessionTenanciesDiffer([AMAZON.path, PUBLIC.path], [PUBLIC, AMAZON])).toBe(false);
    });

    test("a session missing a tenancy is stale", () => {
        expect(sessionTenanciesDiffer([PUBLIC.path], [PUBLIC, AMAZON])).toBe(true);
    });

    test("a session with a tenancy the user lost is stale", () => {
        expect(sessionTenanciesDiffer([PUBLIC.path, AMAZON.path], [PUBLIC])).toBe(true);
        expect(sessionTenanciesDiffer(undefined, [PUBLIC])).toBe(true);
    });

    test("the welcome uses the first name", () => {
        expect(firstNameOf("Fernanda Lima")).toBe("Fernanda");
        expect(firstNameOf("  Ana  ")).toBe("Ana");
    });

    test("no name gives an empty first name", () => {
        expect(firstNameOf(undefined)).toBe("");
        expect(firstNameOf(null)).toBe("");
    });

    test("a path reads with spaced separators", () => {
        expect(tenancyPathLabel("datamap/production/public")).toBe("datamap / production / public");
    });
});
