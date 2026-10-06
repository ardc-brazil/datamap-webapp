/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockRevalidateRequests = jest.fn();
const mockRevalidateTenancies = jest.fn();
const mockQueries: unknown[] = [];
let mockRouter: { pathname: string, query: Record<string, string>, replace: typeof mockReplace };
let mockRequests: { data?: unknown, error?: unknown, mutate: typeof mockRetry };

jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../../../hooks/UseDebouncedValue", () => ({ useDebouncedValue: (value: unknown) => value }));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useAdminCounts: () => ({ data: { open: 4, join: 2, new: 2, closed: 31 } }),
    useAdminRequests: (query: unknown) => {
        mockQueries.push(query);
        return mockRequests;
    },
    useRecentlyClosed: () => ({ data: { items: [], total_count: 0, limit: 5, offset: 0 } }),
    revalidateAdminRequests: () => mockRevalidateRequests(),
    revalidateAdminTenancies: () => mockRevalidateTenancies(),
}));
jest.mock("../../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("../ReviewRequestDialog", () => {
    const React = require("react");
    return {
        ReviewRequestDialog: (props: any) => React.createElement("div", null,
            `reviewing ${props.requestId}`,
            React.createElement("button", { onClick: props.onClose }, "stub close"),
            React.createElement("button", { onClick: props.onApproved }, "stub approve")),
    };
});

import { adminRequest } from "../../../../fake-data/adminFixtures";
import { RequestsView } from "../RequestsView";

const NOW = new Date("2026-10-04T12:00:00Z");
const REQUEST_ID = "7a9b5d5e-fa6d-4c18-9a51-2b1e2c3d4e5f";

function page(items: unknown[], total = items.length, offset = 0) {
    return { items, total_count: total, limit: 50, offset };
}

function lastQuery() {
    return mockQueries[mockQueries.length - 1];
}

beforeEach(() => {
    mockQueries.length = 0;
    mockRouter = { pathname: "/app/admin/requests", query: {}, replace: mockReplace };
    mockRequests = { data: page([adminRequest()]), mutate: mockRetry };
});

describe("RequestsView", () => {
    test("the header counts what is open, and each pill its share", () => {
        render(<RequestsView now={NOW} />);

        expect(screen.getByRole("heading", { name: "Requests" })).toBeTruthy();
        expect(screen.getByText("4 open · 2 for existing tenancies, 2 for new ones")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Open 4" }).getAttribute("aria-pressed")).toBe("true");
        expect(screen.getByRole("button", { name: "Join existing 2" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "New tenancy 2" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Closed 31" })).toBeTruthy();
        expect(screen.getByPlaceholderText("Name, email or ORCID")).toBeTruthy();
        expect(screen.getByText("Fernanda Lima")).toBeTruthy();
        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 0 });
    });

    test("says the queue is loading", () => {
        mockRequests = { mutate: mockRetry };

        render(<RequestsView now={NOW} />);

        expect(screen.getByText("Loading requests…")).toBeTruthy();
    });

    test("says when the queue could not load, and retries", () => {
        mockRequests = { error: { status: 500 }, mutate: mockRetry };

        render(<RequestsView now={NOW} />);
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(screen.getByText("Requests could not be loaded.")).toBeTruthy();
        expect(mockRetry).toHaveBeenCalled();
    });

    test("an empty queue, and a search that matches nothing", () => {
        mockRequests = { data: page([]), mutate: mockRetry };

        render(<RequestsView now={NOW} />);
        expect(screen.getByText("No open requests. Requests people send from the app appear here.")).toBeTruthy();

        fireEvent.change(screen.getByPlaceholderText("Name, email or ORCID"), { target: { value: " tanaka " } });
        expect(screen.getByText("No requests match “tanaka”.")).toBeTruthy();
        expect(lastQuery()).toEqual({ status: "open", q: "tanaka", offset: 0 });
    });

    test("the pills change the query", () => {
        render(<RequestsView now={NOW} />);

        fireEvent.click(screen.getByRole("button", { name: "Join existing 2" }));
        expect(lastQuery()).toEqual({ status: "open", kind: "join", q: "", offset: 0 });

        fireEvent.click(screen.getByRole("button", { name: "New tenancy 2" }));
        expect(lastQuery()).toEqual({ status: "open", kind: "new", q: "", offset: 0 });

        fireEvent.click(screen.getByRole("button", { name: "Closed 31" }));
        expect(lastQuery()).toEqual({ status: "closed", q: "", offset: 0 });
    });

    test("Review puts the request in the URL", () => {
        render(<RequestsView now={NOW} />);

        fireEvent.click(screen.getByRole("button", { name: "Review" }));

        expect(mockReplace).toHaveBeenCalledWith({ pathname: "/app/admin/requests", query: { request: REQUEST_ID } }, undefined, { shallow: true });
    });

    test("?request= opens the review, and closing it takes the parameter away", () => {
        mockRouter.query = { request: REQUEST_ID };

        render(<RequestsView now={NOW} />);
        expect(screen.getByText(`reviewing ${REQUEST_ID}`)).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "stub close" }));
        expect(mockReplace).toHaveBeenCalledWith({ pathname: "/app/admin/requests", query: {} }, undefined, { shallow: true });
        expect(mockRevalidateRequests).toHaveBeenCalled();
    });

    test("an approval refreshes the requests and the tenancies, and closes the review", () => {
        mockRouter.query = { request: REQUEST_ID };

        render(<RequestsView now={NOW} />);
        fireEvent.click(screen.getByRole("button", { name: "stub approve" }));

        expect(mockRevalidateRequests).toHaveBeenCalled();
        expect(mockRevalidateTenancies).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith({ pathname: "/app/admin/requests", query: {} }, undefined, { shallow: true });
    });

    test("an approval closes the review at once, before the route change lands, so it never shows the request as already approved", () => {
        mockRouter.query = { request: REQUEST_ID };

        render(<RequestsView now={NOW} />);
        fireEvent.click(screen.getByRole("button", { name: "stub approve" }));

        expect(screen.queryByText(`reviewing ${REQUEST_ID}`)).toBeNull();
    });

    test("Decline… from the row menu opens the decline prompt", () => {
        render(<RequestsView now={NOW} />);

        fireEvent.click(screen.getByRole("button", { name: "More actions for Fernanda Lima" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Decline…" }));

        expect(screen.getByRole("dialog", { name: "Decline request?" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(screen.queryByRole("dialog", { name: "Decline request?" })).toBeNull();
        expect(mockRevalidateRequests).toHaveBeenCalled();
    });

    test("more than 50 requests page by 50", () => {
        mockRequests = { data: page(Array.from({ length: 50 }, (_, i) => adminRequest({ id: `id-${i}` })), 120), mutate: mockRetry };

        render(<RequestsView now={NOW} />);
        expect(screen.getByText("1–50 of 120")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 50 });
    });

    test("at the last page, Next is disabled and Previous asks for the page before", () => {
        mockRequests = { data: page(Array.from({ length: 20 }, (_, i) => adminRequest({ id: `id-${i}` })), 120, 100), mutate: mockRetry };

        render(<RequestsView now={NOW} />);
        expect(screen.getByText("101–120 of 120")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);

        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 50 });
    });

    test("deciding the only request on a later page steps back to the last page with items", () => {
        mockRequests = { data: page(Array.from({ length: 50 }, (_, i) => adminRequest({ id: `id-${i}` })), 120), mutate: mockRetry };
        render(<RequestsView now={NOW} />);

        mockRequests = { data: page([], 50, 50), mutate: mockRetry };
        fireEvent.click(screen.getByRole("button", { name: "Next" }));

        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 0 });
    });

    test("the total drops under an already-open page: step back to the page that still has items", () => {
        mockRequests = { data: page(Array.from({ length: 50 }, (_, i) => adminRequest({ id: `id-${i}` })), 101), mutate: mockRetry };
        render(<RequestsView now={NOW} />);

        mockRequests = { data: page(Array.from({ length: 50 }, (_, i) => adminRequest({ id: `id2-${i}` })), 101, 50), mutate: mockRetry };
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 50 });

        mockRequests = { data: page([], 100, 100), mutate: mockRetry };
        fireEvent.click(screen.getByRole("button", { name: "Next" }));

        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 50 });
    });

    test("a search change does not fetch with the old offset", () => {
        mockRequests = { data: page(Array.from({ length: 50 }, (_, i) => adminRequest({ id: `id-${i}` })), 120), mutate: mockRetry };
        render(<RequestsView now={NOW} />);

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(lastQuery()).toEqual({ status: "open", q: "", offset: 50 });

        mockRequests = { data: page([adminRequest()]), mutate: mockRetry };
        fireEvent.change(screen.getByPlaceholderText("Name, email or ORCID"), { target: { value: "tanaka" } });

        expect(mockQueries).not.toContainEqual({ status: "open", q: "tanaka", offset: 50 });
        expect(lastQuery()).toEqual({ status: "open", q: "tanaka", offset: 0 });
    });
});
