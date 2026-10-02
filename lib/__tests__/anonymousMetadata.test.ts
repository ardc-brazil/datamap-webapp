import { describe, expect, test } from '@jest/globals';
import { anonymousMetadataEntries, authorCount, displayValue, extensionLabel, latestVersion } from "../anonymousMetadata";

describe("displayValue", () => {
    test("a redacted list keeps its length", () => {
        expect(displayValue([{ name: "[redacted]" }, { name: "[redacted]" }, { name: "[redacted]" }]))
            .toBe("[redacted] · [redacted] · [redacted]");
    });

    test("empty values read as a dash", () => {
        expect(displayValue("")).toBe("—");
        expect(displayValue(null)).toBe("—");
        expect(displayValue([])).toBe("—");
    });

    test("objects join their values", () => {
        expect(displayValue({ temporal: "1h", spatial: "1km" })).toBe("1h · 1km");
    });
});

describe("anonymousMetadataEntries", () => {
    test("in the design's order, marks redacted rows, skips the description", () => {
        const entries = anonymousMetadataEntries({
            grid_type: "regular",
            license: "CC-BY-4.0",
            description: "long text",
            institution: "[redacted]",
            authors: [{ name: "[redacted]" }, { name: "[redacted]" }],
        });

        expect(entries).toEqual([
            { key: "authors", label: "Authors", value: "[redacted] · [redacted]", redacted: true },
            { key: "institution", label: "Institution", value: "[redacted]", redacted: true },
            { key: "license", label: "License", value: "CC-BY-4.0", redacted: false },
            { key: "grid_type", label: "Grid type", value: "regular", redacted: false },
        ]);
    });
});

describe("the shape of what is hidden", () => {
    test("counts the authors without naming them", () => {
        expect(authorCount({ authors: [{ name: "[redacted]" }, { name: "[redacted]" }] })).toBe(2);
        expect(authorCount({})).toBe(0);
    });

    test("the latest version is the one with the newest creation", () => {
        const versions: any = [
            { name: "1", created_at: "2026-08-01T00:00:00Z" },
            { name: "2", created_at: "2026-09-01T00:00:00Z" },
        ];
        expect(latestVersion(versions).name).toBe("2");
        expect(latestVersion([])).toBeUndefined();
    });

    test("files without an extension are named so", () => {
        expect(extensionLabel(".nc")).toBe(".nc");
        expect(extensionLabel(null)).toBe("no extension");
    });
});
