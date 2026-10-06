/** @jest-environment jsdom */
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { ADMIN_COPY } from "../../../contants/AdminConstants";
import { AdminEmptyState } from "../AdminEmptyState";
import { AdminLoadError } from "../AdminLoadError";
import { AdminPageHeader } from "../AdminPageHeader";
import { CountBadge } from "../CountBadge";

describe("the admin shell parts", () => {
    test("a page header has its title, subtitle and action", () => {
        render(<AdminPageHeader title="Tenancies" subtitle="4 tenancies" action={<button>+ New tenancy</button>} />);

        expect(screen.getByRole("heading", { name: "Tenancies" })).toBeTruthy();
        expect(screen.getByText("4 tenancies")).toBeTruthy();
        expect(screen.getByRole("button", { name: "+ New tenancy" })).toBeTruthy();
    });

    test("Users and Activity say they are coming soon", () => {
        render(<>
            <AdminEmptyState title={ADMIN_COPY.usersTitle} text={ADMIN_COPY.usersEmpty} />
            <AdminEmptyState title={ADMIN_COPY.activityTitle} text={ADMIN_COPY.activityEmpty} />
        </>);

        expect(screen.getByRole("heading", { name: "Users" })).toBeTruthy();
        expect(screen.getByText("Coming soon. Until then, add and remove people from Tenancies.")).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Activity" })).toBeTruthy();
        expect(screen.getByText("Coming soon: every admin action, who and when.")).toBeTruthy();
    });

    test("a load error says what failed and offers to try again", () => {
        const onRetry = jest.fn();
        render(<AdminLoadError message="Requests could not be loaded." onRetry={onRetry} />);

        expect(screen.getByRole("alert").textContent).toContain("Requests could not be loaded.");
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(onRetry).toHaveBeenCalled();
    });

    test("a count badge shows a positive count and nothing otherwise", () => {
        const { rerender } = render(<CountBadge count={4} label="open requests" />);
        expect(screen.getByLabelText("4 open requests").textContent).toBe("4");

        rerender(<CountBadge count={0} label="open requests" />);
        expect(screen.queryByLabelText(/open requests/)).toBeNull();

        rerender(<CountBadge label="open requests" />);
        expect(screen.queryByLabelText(/open requests/)).toBeNull();
    });
});
