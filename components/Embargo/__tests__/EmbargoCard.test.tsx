/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock("next/router", () => ({ useRouter: () => ({ reload: jest.fn() }) }));
jest.mock("swr", () => ({ __esModule: true, default: () => ({ data: undefined }) }));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));

jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import { EmbargoCard } from "../EmbargoCard";

const owner = { level: "owner", can_edit: true, can_share: true, can_manage_embargo: true, can_extend_embargo: true, can_delete: true };

function dataset(overrides: any = {}): any {
    return {
        id: "d1",
        tenancy: "datamap/production/data-amazon",
        embargo: { until: "2026-12-15T23:59:59+00:00", active: true, metadata_visible: true, note: "Under review at JGR Atmospheres" },
        access: owner,
        ...overrides,
    };
}

beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-01T10:00:00Z") });
});

describe("EmbargoCard", () => {
    test("says how long, who knows, and what the owner can do", () => {
        render(<EmbargoCard dataset={dataset()} />);

        expect(screen.getByText("76 days left")).toBeTruthy();
        expect(screen.getByText("Ends Dec 15, 2026 · files open to Data Amazon")).toBeTruthy();
        expect(screen.getByText(/Members can see it exists\./)).toBeTruthy();
        expect(screen.getByText("“Under review at JGR Atmospheres”")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Change" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Extend" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "End early" })).toBeTruthy();
    });

    test("someone who may only read sees the facts and no action", () => {
        render(<EmbargoCard dataset={dataset({ access: { ...owner, level: "read", can_manage_embargo: false, can_extend_embargo: false } })} />);

        expect(screen.getByText(/Hidden from members|Members can see it exists/)).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Extend" })).toBeNull();
        expect(screen.queryByRole("button", { name: "End early" })).toBeNull();
    });

    test("a member of the tenancy gets no card: the files section tells them instead", () => {
        render(<EmbargoCard dataset={dataset({ access: { ...owner, level: "tenancy" } })} />);

        expect(screen.queryByText(/days left/)).toBeNull();
    });
});
