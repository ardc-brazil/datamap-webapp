/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { AnonymousMetadataList } from "../AnonymousMetadataList";

describe("AnonymousMetadataList", () => {
    test("redacted fields keep their place, in grey monospace", () => {
        render(<AnonymousMetadataList data={{ authors: [{ name: "[redacted]" }, { name: "[redacted]" }], license: "CC-BY-4.0" }} />);

        expect(screen.getByText("Authors")).toBeTruthy();
        expect(screen.getByText("[redacted] · [redacted]").className).toContain("font-mono");
        expect(screen.getByText("CC-BY-4.0").className).not.toContain("font-mono");
    });
});
