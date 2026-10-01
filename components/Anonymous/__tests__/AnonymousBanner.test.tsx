/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { AnonymousBanner } from "../AnonymousBanner";

const dataset: any = { name: "x", data: {}, versions: [] };

describe("AnonymousBanner", () => {
    test("under embargo: who is reading, what is hidden, until when", () => {
        render(<AnonymousBanner page={{ state: "active", embargo_until: "2026-12-15T23:59:59+00:00", dataset }} />);

        const banner = screen.getByRole("note");
        expect(banner.textContent).toContain("You're reading this dataset as an anonymous reviewer. Authorship is redacted and the files aren't available. The dataset is under embargo until Dec 15, 2026.");
        expect(banner.className).toContain("bg-embargo-100");
    });

    test("after the embargo: where the link will lead", () => {
        render(<AnonymousBanner page={{ state: "ended", embargo_ended_at: "2026-12-15T23:59:59+00:00", dataset }} />);

        const banner = screen.getByRole("note");
        expect(banner.textContent).toContain("Anonymous view · authorship redacted, files not available. The embargo ended on Dec 15, 2026; the dataset hasn't been published yet. This link leads to the public page once it is.");
        expect(banner.className).not.toContain("embargo");
    });
});
