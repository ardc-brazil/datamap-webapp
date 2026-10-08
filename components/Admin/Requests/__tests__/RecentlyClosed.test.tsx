/** @jest-environment jsdom */
import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";

let mockClosed: { data?: unknown, error?: unknown } = {};

jest.mock("../../../../hooks/UseAdmin", () => ({ useRecentlyClosed: () => mockClosed }));

import { DATA_AMAZON, adminRequest } from "../../../../fake-data/adminFixtures";
import { RecentlyClosed } from "../RecentlyClosed";

function page(items: unknown[]) {
    return { items, total_count: items.length, limit: 5, offset: 0 };
}

describe("RecentlyClosed", () => {
    test("says it is loading", () => {
        mockClosed = {};

        render(<RecentlyClosed />);

        expect(screen.getByText("Recently closed")).toBeTruthy();
        expect(screen.getByText("Loading…")).toBeTruthy();
    });

    test("says when nothing was closed yet", () => {
        mockClosed = { data: page([]) };

        render(<RecentlyClosed />);

        expect(screen.getByText("No closed requests yet.")).toBeTruthy();
    });

    test("says when it could not load", () => {
        mockClosed = { error: { status: 500 } };

        render(<RecentlyClosed />);

        expect(screen.getByText("Recently closed requests could not be loaded.")).toBeTruthy();
    });

    test("lists who, where, how it ended, by whom and when, with a way to Activity", () => {
        mockClosed = {
            data: page([
                adminRequest({ requester: { id: "m1", name: "Marcia Yamasoe", email: "m@usp.br", email_verified: true, orcid: null }, status: "approved", tenancy: DATA_AMAZON, decided_by: { id: "c1", name: "Caio Maia" }, decided_at: "2026-10-01T10:48:00+00:00" }),
                adminRequest({ id: "9c1d7f70-1c8f-4e3a-9c73-4d3e4f5a6b71", requester: { id: "t1", name: "Test User", email: "t@usp.br", email_verified: true, orcid: null }, status: "declined", suggested_tenancy: null, requested_name: "ATTO", decided_by: { id: "a1", name: "André Maia" }, decided_at: "2026-09-24T10:00:00+00:00" }),
            ]),
        };

        render(<RecentlyClosed />);

        expect(screen.getByText((_, element) => element?.textContent === "Marcia Yamasoe · Data Amazon · Approved")).toBeTruthy();
        expect(screen.getByText("Approved").className).toContain("text-success-500");
        expect(screen.getByText("by Caio Maia · Oct 1")).toBeTruthy();
        expect(screen.getByText((_, element) => element?.textContent === "Test User · ATTO · Declined")).toBeTruthy();
        expect(screen.getByText("Declined").className).toContain("text-danger-700");
        expect(screen.getByRole("link", { name: "Activity →" }).getAttribute("href")).toBe("/app/admin/activity");
    });
});
