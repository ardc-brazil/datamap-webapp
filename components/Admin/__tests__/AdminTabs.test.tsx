/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

let mockPathname = "/app/admin/requests";
let mockCounts: unknown = { open: 4, join: 2, new: 2, closed: 31 };

jest.mock("next/router", () => ({ useRouter: () => ({ pathname: mockPathname }) }));
jest.mock("../../../hooks/UseAdmin", () => ({ useAdminCounts: () => ({ data: mockCounts }) }));

import { AdminTabs } from "../AdminTabs";

test("Requests, Users, Tenancies and Activity, with the open count on Requests", () => {
    render(<AdminTabs />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/app/admin/requests", "/app/admin/users", "/app/admin/tenancies", "/app/admin/activity"]);
    expect(links[0].textContent).toBe("Requests4");
    expect(screen.getByLabelText("4 open requests")).toBeTruthy();
});

test("the tab of the current page is the active one", () => {
    mockPathname = "/app/admin/tenancies";

    render(<AdminTabs />);

    expect(screen.getByRole("link", { name: "Tenancies" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Tenancies" }).className).toContain("border-primary-900");
    expect(screen.getByRole("link", { name: "Users" }).getAttribute("aria-current")).toBeNull();
});

test("a page below a tab keeps that tab active, but a tab that only shares a prefix does not", () => {
    mockPathname = "/app/admin/users/[userId]";

    render(<AdminTabs />);

    expect(screen.getByRole("link", { name: "Users" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page")).toHaveLength(1);
});

test("no badge when nothing is open", () => {
    mockCounts = { open: 0, join: 0, new: 0, closed: 31 };

    render(<AdminTabs />);

    expect(screen.queryByLabelText(/open requests/)).toBeNull();
});
