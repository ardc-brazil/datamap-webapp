/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

let mockSession: { data: unknown, status: string } = { data: null, status: "loading" };

jest.mock("next-auth/react", () => ({
    useSession: () => mockSession,
}));

jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: jest.fn() },
    useRouter: () => ({ asPath: "/app/admin/requests", push: jest.fn() }),
}));

jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({
        setTenancySelected: jest.fn(),
        isTenancySelected: () => true,
    }),
}));

import { RequireSession } from "../RequireSession";

function sessionOf(user: object) {
    return { data: { user: { name: "Ada", tenancies: [], ...user }, expires: "2099-01-01" }, status: "authenticated" };
}

function renderGate(admin: boolean) {
    return render(
        <RequireSession loading={<div>loading</div>} admin={admin}>
            <div>admin page</div>
        </RequireSession>,
    );
}

test("an admin page renders for an admin", () => {
    mockSession = sessionOf({ admin: true });

    renderGate(true);

    expect(screen.getByText("admin page")).toBeTruthy();
});

test("an admin page is the not-found page for anyone else", () => {
    mockSession = sessionOf({ admin: false });

    renderGate(true);

    expect(screen.queryByText("admin page")).toBeNull();
    expect(screen.getByText("404 - Page Not Found")).toBeTruthy();
});

test("a session from before the claim existed is not an admin", () => {
    mockSession = sessionOf({});

    renderGate(true);

    expect(screen.getByText("404 - Page Not Found")).toBeTruthy();
});

test("while the session is unknown it shows the loading element, not the 404", () => {
    mockSession = { data: null, status: "loading" };

    renderGate(true);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("404 - Page Not Found")).toBeNull();
});

test("a page that is not an admin page renders for everyone", () => {
    mockSession = sessionOf({ admin: false });

    renderGate(false);

    expect(screen.getByText("admin page")).toBeTruthy();
});
