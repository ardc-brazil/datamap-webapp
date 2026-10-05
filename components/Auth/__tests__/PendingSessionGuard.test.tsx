/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

let mockSession: { data: unknown, status: string } = { data: null, status: "unauthenticated" };
let mockRouter: { pathname: string, asPath: string, query: Record<string, string>, isReady: boolean };
const mockReplace = jest.fn();

jest.mock("next-auth/react", () => ({
    useSession: () => mockSession,
}));

jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: (...args: unknown[]) => mockReplace(...args) },
    useRouter: () => mockRouter,
}));

import { PendingSessionGuard } from "../PendingSessionGuard";

const PENDING = { data: { user: { pending: true }, expires: "2099-01-01" }, status: "authenticated" };
const CONFIRMED = { data: { user: { name: "Ada" }, expires: "2099-01-01" }, status: "authenticated" };

function renderGuard(loading?: JSX.Element) {
    return render(
        <PendingSessionGuard loading={loading}>
            <div>page</div>
        </PendingSessionGuard>,
    );
}

beforeEach(() => {
    mockRouter = { pathname: "/datasets/[datasetId]", asPath: "/datasets/d1", query: { datasetId: "d1" }, isReady: true };
});

test("a pending session on a public page is sent to confirm its email", () => {
    mockSession = PENDING;

    renderGuard();

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/account/confirm-email?callbackUrl=%2Fdatasets%2Fd1");
});

test("a pending session on the confirmation page is not redirected", () => {
    mockSession = PENDING;
    mockRouter = { pathname: "/account/confirm-email", asPath: "/account/confirm-email?callbackUrl=%2F", query: { callbackUrl: "/" }, isReady: true };

    const { rerender } = renderGuard();
    rerender(<PendingSessionGuard><div>page</div></PendingSessionGuard>);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText("page")).toBeTruthy();
});

test("a confirmed session on the confirmation page returns to its callbackUrl", () => {
    mockSession = CONFIRMED;
    mockRouter = { pathname: "/account/confirm-email", asPath: "/account/confirm-email?callbackUrl=%2Finvitations%2Ftok", query: { callbackUrl: "/invitations/tok" }, isReady: true };

    renderGuard();

    expect(mockReplace).toHaveBeenCalledWith("/invitations/tok");
});

test("a signed-out visitor and a confirmed session on a public page stay put", () => {
    mockSession = { data: null, status: "unauthenticated" };
    renderGuard();
    mockSession = CONFIRMED;
    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
});

test("waits for the router query before deciding", () => {
    mockSession = CONFIRMED;
    mockRouter = { pathname: "/account/confirm-email", asPath: "/account/confirm-email", query: {}, isReady: false };

    renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
});

test("a protected page shows its loading element instead of the page while being redirected", () => {
    mockSession = PENDING;

    renderGuard(<div>loading</div>);

    expect(screen.getByText("loading")).toBeTruthy();
    expect(screen.queryByText("page")).toBeNull();
});

test("a public page keeps rendering while being redirected", () => {
    mockSession = PENDING;

    renderGuard();

    expect(screen.getByText("page")).toBeTruthy();
});
