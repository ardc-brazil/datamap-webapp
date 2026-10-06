/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { adminRequest, newTenancyRequest } from "../../../../fake-data/adminFixtures";
import { RequestsTable } from "../RequestsTable";

const NOW = new Date("2026-10-04T12:00:00Z");

function renderTable(requests: any[], closed = false) {
    const onReview = jest.fn();
    const onDecline = jest.fn();
    render(<RequestsTable requests={requests} closed={closed} now={NOW} onReview={onReview} onDecline={onDecline} />);
    return { onReview, onDecline };
}

describe("RequestsTable", () => {
    test("a join row: who, what, since when, email state, and Review", () => {
        const { onReview } = renderTable([adminRequest()]);

        expect(screen.getByText("Account")).toBeTruthy();
        expect(screen.getByText("Fernanda Lima")).toBeTruthy();
        expect(screen.getByText("fernanda.lima@inpe.br")).toBeTruthy();
        expect(screen.getByText("Join")).toBeTruthy();
        expect(screen.getByText("Data Amazon")).toBeTruthy();
        expect(screen.getByText("Postdoc in Luciana Rizzo's group, GoAmazon SMPS data")).toBeTruthy();
        expect(screen.getByText("Sep 28, 2026")).toBeTruthy();
        expect(screen.getByText("6 days waiting").className).toContain("text-embargo-800");
        expect(screen.getByText("verified")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Review" }));
        expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ id: "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f" }));
    });

    test("a fresh new-tenancy row from an unverified account", () => {
        renderTable([newTenancyRequest()]);

        expect(screen.getByText("New")).toBeTruthy();
        expect(screen.getByText("Cerrado Flux")).toBeTruthy();
        expect(screen.getByText("1 day waiting").className).toContain("text-primary-500");
        expect(screen.getByText("unverified")).toBeTruthy();
    });

    test("the row menu holds Decline…", () => {
        const { onDecline } = renderTable([adminRequest()]);

        fireEvent.click(screen.getByRole("button", { name: "More actions for Fernanda Lima" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Decline…" }));

        expect(onDecline).toHaveBeenCalledWith(expect.objectContaining({ id: "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f" }));
    });

    test("a closed row shows how it ended instead of the actions", () => {
        renderTable([newTenancyRequest({
            status: "approved",
            created_tenancy: true,
            tenancy: { path: "datamap/production/cerrado-flux", display_name: "Cerrado Flux", is_default: false, is_legacy: false },
            decided_by: { id: "c1", name: "Caio Maia" },
            decided_at: "2026-10-01T10:48:00+00:00",
        })], true);

        expect(screen.getByText("Approved · new tenancy").className).toContain("text-success-500");
        expect(screen.getByText("decided Oct 1")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Review" })).toBeNull();
    });
});
