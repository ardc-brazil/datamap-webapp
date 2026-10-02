/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock("next/router", () => ({ useRouter: () => ({ reload: jest.fn() }) }));
jest.mock("swr", () => ({ __esModule: true, default: () => ({ data: undefined }) }));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));

jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import { EmbargoSettingsSection } from "../EmbargoSettingsSection";

const owner = { level: "owner", can_edit: true, can_share: true, can_manage_embargo: true, can_extend_embargo: true, can_delete: true };

beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-01T10:00:00Z") });
});

describe("EmbargoSettingsSection", () => {
    test("under embargo: one row per fact, each with its action", () => {
        render(<EmbargoSettingsSection dataset={{
            id: "d1", tenancy: "t", access: owner, versions: [],
            embargo: { until: "2026-12-15T23:59:59+00:00", active: true, metadata_visible: true, note: "Under review at JGR Atmospheres" },
        } as any} />);

        expect(screen.getByText("Under embargo")).toBeTruthy();
        expect(screen.getByText("76 days left")).toBeTruthy();
        expect(screen.getByText("Dec 15, 2026")).toBeTruthy();
        expect(screen.getByText("Visible to members")).toBeTruthy();
        expect(screen.getByText("Under review at JGR Atmospheres")).toBeTruthy();
        expect(screen.getByText("15, 10, 5 and 1 day before the end")).toBeTruthy();
        for (const action of ["End early", "Extend", "Hide", "Edit"]) {
            expect(screen.getByRole("button", { name: action })).toBeTruthy();
        }
    });

    test("on the last day, one day left", () => {
        render(<EmbargoSettingsSection dataset={{
            id: "d1", tenancy: "t", access: owner, versions: [],
            embargo: { until: "2026-10-01T23:59:59+00:00", active: true, metadata_visible: true, note: null },
        } as any} />);

        expect(screen.getByText("1 day left")).toBeTruthy();
    });

    test("before an embargo: Set embargo", () => {
        render(<EmbargoSettingsSection dataset={{ id: "d1", tenancy: "t", access: owner, versions: [], embargo: null } as any} />);

        expect(screen.getByText("Not under embargo")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Set embargo" })).toBeTruthy();
    });

    test("with an external DOI, it says why an embargo is not possible", () => {
        render(<EmbargoSettingsSection dataset={{ id: "d1", tenancy: "t", access: owner, versions: [{ doi: { mode: "MANUAL" } }], embargo: null } as any} />);

        expect(screen.queryByRole("button", { name: "Set embargo" })).toBeNull();
        expect(screen.getByText("This dataset has a manual DOI, so it can no longer be put under embargo.")).toBeTruthy();
    });

    test("someone who may only extend sees only Extend", () => {
        render(<EmbargoSettingsSection dataset={{
            id: "d1", tenancy: "t", versions: [],
            access: { ...owner, level: "write", can_manage_embargo: false },
            embargo: { until: "2026-12-15T23:59:59+00:00", active: true, metadata_visible: false, note: null },
        } as any} />);

        expect(screen.getByRole("button", { name: "Extend" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "End early" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Show" })).toBeNull();
    });
});
