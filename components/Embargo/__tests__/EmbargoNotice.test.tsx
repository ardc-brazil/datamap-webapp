/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { EmbargoNotice } from "../EmbargoNotice";

describe("EmbargoNotice", () => {
    test("a date, a reserved identifier, and nothing about the dataset", () => {
        render(<EmbargoNotice until="2026-12-15T23:59:59+00:00" doi="10.5281/datamap.3f9c1e" />);

        const notice = screen.getByRole("status");
        expect(screen.getByRole("heading", { name: "This dataset is under embargo" })).toBeTruthy();
        expect(notice.textContent).toContain("It will become available on DataMap on December 15, 2026. The identifier below is reserved and will lead to the dataset once it is published.");
        expect(screen.getByText("doi:10.5281/datamap.3f9c1e")).toBeTruthy();
        expect(screen.getByRole("link", { name: "Learn more" }).getAttribute("href")).toBe("/project/about");
    });

    test("without an identifier, no identifier line", () => {
        render(<EmbargoNotice until="2026-12-15T23:59:59+00:00" doi={null} />);

        expect(screen.queryByText(/^doi:/)).toBeNull();
    });
});
