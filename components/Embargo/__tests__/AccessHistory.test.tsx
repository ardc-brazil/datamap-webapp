/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const extended = {
    event_type: "extended", occurred_at: "2026-09-24T09:41:00Z", actor: { id: "o", name: "Luciana Rizzo" }, subject: null,
    old_value: { until: "2026-11-30T23:59:59+00:00" }, new_value: { until: "2026-12-15T23:59:59+00:00" }, note: "Second review round requested",
};
const granted = {
    event_type: "permission_granted", occurred_at: "2026-09-12T16:05:00Z", actor: { id: "a", name: "Alan Calheiros" }, subject: "Caio Maia",
    old_value: null, new_value: { level: "read" }, note: null,
};
let mockItems: any[] = [extended, granted];

jest.mock("swr", () => ({
    __esModule: true,
    default: () => ({ data: { items: mockItems } }),
}));

jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import { AccessHistory } from "../AccessHistory";

describe("AccessHistory", () => {
    test("a person, a date and a reason for every decision", () => {
        render(<AccessHistory datasetId="d1" />);

        expect(screen.getByText("Luciana Rizzo")).toBeTruthy();
        expect(screen.getByText("extended the embargo to Dec 15, 2026")).toBeTruthy();
        expect(screen.getByText("was Nov 30, 2026 · \"Second review round requested\"")).toBeTruthy();
        expect(screen.getByText("Sep 24, 2026 09:41")).toBeTruthy();
        expect(screen.getByText("granted read access to Caio Maia")).toBeTruthy();
    });

    test("newest first, whatever order the server sends", () => {
        mockItems = [granted, extended];
        render(<AccessHistory datasetId="d1" />);

        const rows = screen.getAllByRole("listitem").map((row) => row.textContent);
        expect(rows[0]).toContain("extended the embargo");
        expect(rows[1]).toContain("granted read access");
    });
});
