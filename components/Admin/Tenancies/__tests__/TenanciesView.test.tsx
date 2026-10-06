/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

const mockReplace = jest.fn();
const mockRetry = jest.fn();
const mockRevalidateTenancies = jest.fn();
let mockRouter: { pathname: string, query: Record<string, string>, replace: typeof mockReplace };
let mockTenancies: { data?: unknown, error?: unknown, mutate: typeof mockRetry };

jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../../../hooks/UseAdmin", () => ({
    useAdminTenancies: () => mockTenancies,
    revalidateAdminTenancies: () => mockRevalidateTenancies(),
}));
jest.mock("../TenancyMembersPanel", () => {
    const React = require("react");
    return { TenancyMembersPanel: (props: any) => React.createElement("div", null, `panel ${props.tenancy.path}`) };
});
jest.mock("../NewTenancyDialog", () => {
    const React = require("react");
    return {
        NewTenancyDialog: (props: any) => React.createElement("button", {
            onClick: () => props.onCreated({ path: "datamap/production/cerrado-flux" }),
        }, "stub create"),
    };
});

import { ADMIN_TENANCIES } from "../../../../fake-data/adminFixtures";
import { TenanciesView } from "../TenanciesView";

beforeEach(() => {
    mockRouter = { pathname: "/app/admin/tenancies", query: {}, replace: mockReplace };
    mockTenancies = { data: ADMIN_TENANCIES, mutate: mockRetry };
});

describe("TenanciesView", () => {
    test("says the tenancies are loading", () => {
        mockTenancies = { mutate: mockRetry };

        render(<TenanciesView />);

        expect(screen.getByText("Loading tenancies…")).toBeTruthy();
    });

    test("says when the tenancies could not load, and retries", () => {
        mockTenancies = { error: { status: 500 }, mutate: mockRetry };

        render(<TenanciesView />);
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(screen.getByText("Tenancies could not be loaded.")).toBeTruthy();
        expect(mockRetry).toHaveBeenCalled();
    });

    test("the header, the list, and the first production tenancy selected", () => {
        render(<TenanciesView />);

        expect(screen.getByRole("heading", { name: "Tenancies" })).toBeTruthy();
        expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "4 tenancies · root datamap · everyone is in public")).toBeTruthy();
        expect(screen.getByRole("button", { name: "+ New tenancy" })).toBeTruthy();
        expect(screen.getByText("panel datamap/production/atto")).toBeTruthy();
    });

    test("?tenancy= selects that tenancy", () => {
        mockRouter.query = { tenancy: "datamap/production/public" };

        render(<TenanciesView />);

        expect(screen.getByText("panel datamap/production/public")).toBeTruthy();
    });

    test("an unknown ?tenancy= falls back to the default selection", () => {
        mockRouter.query = { tenancy: "datamap/production/nowhere" };

        render(<TenanciesView />);

        expect(screen.getByText("panel datamap/production/atto")).toBeTruthy();
    });

    test("a click puts the tenancy in the URL", () => {
        render(<TenanciesView />);

        fireEvent.click(screen.getByRole("button", { name: /datamap\/production\/data-amazon/ }));

        expect(mockReplace).toHaveBeenCalledWith(
            { pathname: "/app/admin/tenancies", query: { tenancy: "datamap/production/data-amazon" } },
            undefined,
            { shallow: true },
        );
    });

    test("a new tenancy goes into the list at once, the list is refetched, and it is selected", () => {
        render(<TenanciesView />);

        fireEvent.click(screen.getByRole("button", { name: "+ New tenancy" }));
        fireEvent.click(screen.getByRole("button", { name: "stub create" }));

        expect(mockRetry).toHaveBeenCalledTimes(1);
        const [update, options] = mockRetry.mock.calls[0] as [(list: unknown[]) => unknown[], unknown];
        expect(options).toEqual({ revalidate: true });
        expect(update(ADMIN_TENANCIES)).toEqual([...ADMIN_TENANCIES, { path: "datamap/production/cerrado-flux" }]);
        expect(mockRevalidateTenancies).not.toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith(
            { pathname: "/app/admin/tenancies", query: { tenancy: "datamap/production/cerrado-flux" } },
            undefined,
            { shallow: true },
        );
        expect(screen.queryByRole("button", { name: "stub create" })).toBeNull();
    });
});
