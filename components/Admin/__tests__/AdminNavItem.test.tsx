/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

let mockSession: unknown = null;
let mockPathname = "/app/home";
let mockCounts: unknown = undefined;
const mockCountsEnabled: boolean[] = [];

jest.mock("next-auth/react", () => ({ useSession: () => ({ data: mockSession }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ pathname: mockPathname }) }));
jest.mock("../../../hooks/UseAdmin", () => ({
    useAdminCounts: (enabled: boolean) => {
        mockCountsEnabled.push(enabled);
        return { data: mockCounts };
    },
}));

import { AdminNavItem } from "../AdminNavItem";

const ADMIN = { user: { name: "Caio Maia", admin: true } };

beforeEach(() => {
    mockSession = ADMIN;
    mockPathname = "/app/home";
    mockCounts = { open: 4, join: 2, new: 2, closed: 31 };
    mockCountsEnabled.length = 0;
});

test("is not there for an account that is not an admin, which never asks for the counts", () => {
    mockSession = { user: { name: "Fernanda Lima", admin: false } };

    const { container } = render(<AdminNavItem collapsed={false} />);

    expect(container.innerHTML).toBe("");
    expect(mockCountsEnabled).toEqual([false]);
});

test("an admin gets the entry, opening the requests, with the open count", () => {
    render(<AdminNavItem collapsed={false} />);

    const link = screen.getByRole("link", { name: /Admin/ });
    expect(link.getAttribute("href")).toBe("/app/admin/requests");
    expect(screen.getByLabelText("4 open requests")).toBeTruthy();
    expect(mockCountsEnabled).toEqual([true]);
});

test("the badge is hidden when nothing is open", () => {
    mockCounts = { open: 0, join: 0, new: 0, closed: 31 };

    render(<AdminNavItem collapsed={false} />);

    expect(screen.queryByLabelText(/open requests/)).toBeNull();
});

test("is active on every admin page and only there", () => {
    mockPathname = "/app/admin/tenancies";
    const { unmount } = render(<AdminNavItem collapsed={false} />);
    expect(screen.getByRole("link", { name: /Admin/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Admin/ }).className).toContain("bg-secondary-500");
    unmount();

    mockPathname = "/app/home";
    render(<AdminNavItem collapsed={false} />);
    expect(screen.getByRole("link", { name: /Admin/ }).getAttribute("aria-current")).toBeNull();
});

test("a collapsed sidebar shows the icon with its title, no label or badge", () => {
    render(<AdminNavItem collapsed />);

    expect(screen.getByTitle("Admin")).toBeTruthy();
    expect(screen.queryByText("Admin")).toBeNull();
    expect(screen.queryByLabelText(/open requests/)).toBeNull();
});
