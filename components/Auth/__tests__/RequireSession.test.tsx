/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

let mockSession: { data: unknown, status: string } = { data: null, status: "loading" };
const mockReplace = jest.fn();
let mockOnUnauthenticated: (() => void) | undefined;

jest.mock("next-auth/react", () => ({
    useSession: (options?: { onUnauthenticated?: () => void }) => {
        mockOnUnauthenticated = options?.onUnauthenticated;
        return mockSession;
    },
}));

jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: (...args: unknown[]) => mockReplace(...args) },
    useRouter: () => ({ asPath: "/app/datasets/d1" }),
}));

jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({
        setTenancySelected: jest.fn(),
        isTenancySelected: () => true,
    }),
}));

import { RequireSession } from "../RequireSession";

const SESSION = { user: { name: "Ada", tenancies: [] }, expires: "2099-01-01" };

function renderGate() {
    return render(
        <RequireSession loading={<div>loading</div>}>
            <div>page</div>
        </RequireSession>,
    );
}

test("shows the loading element while the first session is still unknown", () => {
    mockSession = { data: null, status: "loading" };

    renderGate();

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("page")).toBeNull();
});

test("keeps the page mounted while an authenticated session refreshes", () => {
    mockSession = { data: SESSION, status: "authenticated" };
    const { rerender } = renderGate();
    const page = screen.getByText("page");

    mockSession = { data: SESSION, status: "loading" };
    rerender(
        <RequireSession loading={<div>loading</div>}>
            <div>page</div>
        </RequireSession>,
    );

    expect(screen.getByText("page")).toBe(page);
    expect(screen.queryByText("loading")).toBeNull();
});

test("a signed-out visitor is sent to the login page with the current path", () => {
    mockSession = { data: null, status: "loading" };
    renderGate();

    mockOnUnauthenticated?.();

    expect(mockReplace).toHaveBeenCalledWith("/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fdatasets%2Fd1");
});
