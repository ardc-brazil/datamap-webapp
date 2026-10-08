/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const push = jest.fn() as any;
let tenancies: any;
let tenanciesError: any;

jest.mock("../../../hooks/UseTenancies", () => ({
    useMyTenancies: () => ({ data: tenancies, error: tenanciesError }),
    useLatestTenancyRequest: () => ({ state: null, mutate: jest.fn() }),
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: "datamap/production/data-amazon", setTenancySelected: jest.fn() }),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));
jest.mock("../../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import { ProfileTenancies } from "../ProfileTenancies";

const PUBLIC = { path: "datamap/production/public", display_name: "Public", is_default: true, is_legacy: false };
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    push.mockReset();
    tenanciesError = undefined;
});

describe("ProfileTenancies", () => {
    test("while loading, says so and shows no list", () => {
        tenancies = undefined;
        render(<ProfileTenancies />);

        expect(screen.getByText("Loading…")).toBeTruthy();
        expect(screen.queryByRole("listitem")).toBeNull();
    });

    test("a failed load shows an alert instead of the list", () => {
        tenancies = undefined;
        tenanciesError = { status: 500 };
        render(<ProfileTenancies />);

        expect(screen.getByRole("alert").textContent).toBe("Your tenancies could not be loaded.");
        expect(screen.queryByText("Loading…")).toBeNull();
        expect(screen.queryByRole("listitem")).toBeNull();
    });

    test("lists display names and paths, marks Public and the current tenancy", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<ProfileTenancies />);

        expect(screen.getByText("Public")).toBeTruthy();
        expect(screen.getByText("Everyone is in public")).toBeTruthy();
        expect(screen.getByText("Data Amazon")).toBeTruthy();
        expect(screen.getByText("datamap/production/data-amazon")).toBeTruthy();
        expect(screen.getByText("Current").closest("li")?.textContent).toContain("Data Amazon");
    });

    test("with more than one tenancy, Switch tenancy opens the selector", () => {
        tenancies = [PUBLIC, AMAZON];
        render(<ProfileTenancies />);

        fireEvent.click(screen.getByRole("button", { name: /Switch tenancy/ }));

        expect(push).toHaveBeenCalledWith("/app/tenancy");
    });

    test("with one, there is no Switch tenancy", () => {
        tenancies = [PUBLIC];
        render(<ProfileTenancies />);

        expect(screen.queryByRole("button", { name: /Switch tenancy/ })).toBeNull();
    });

    test("Request access opens the form", () => {
        tenancies = [PUBLIC];
        render(<ProfileTenancies />);

        fireEvent.click(screen.getByRole("button", { name: /Request access/ }));

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
    });
});
