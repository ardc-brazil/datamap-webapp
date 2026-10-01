/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const extendEmbargo = jest.fn() as any;
const endEmbargo = jest.fn() as any;
const setEmbargoMode = jest.fn() as any;
const reload = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ reload }) }));
jest.mock("swr", () => ({
    __esModule: true,
    default: () => ({ data: { permissions: [{}, {}, {}], invitations: [], anonymous_links: [] } }),
}));
jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ extendEmbargo, endEmbargo, setEmbargoMode })),
}));

jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import { EmbargoModeDialog, EndEmbargoDialog, ExtendEmbargoDialog } from "../EmbargoDialogs";

const dataset: any = {
    id: "d1",
    tenancy: "datamap/production/data-amazon",
    embargo: { until: "2026-12-15T23:59:59+00:00", active: true, metadata_visible: true, note: null },
};

beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-01T10:00:00Z"), doNotFake: ["setTimeout", "setInterval", "queueMicrotask", "nextTick"] });
});

describe("ExtendEmbargoDialog", () => {
    test("sends the new date with the reason", async () => {
        extendEmbargo.mockResolvedValue({ active: true });
        render(<ExtendEmbargoDialog dataset={dataset} show onClose={jest.fn()} />);

        expect(screen.getByText("Ends Dec 15, 2026")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("New end date"), { target: { value: "2026-12-28" } });
        fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: "Second review round requested" } });
        fireEvent.click(screen.getByRole("button", { name: "Extend to Dec 28" }));

        await waitFor(() => expect(extendEmbargo).toHaveBeenCalledWith("d1", {
            until: "2026-12-28T23:59:59+00:00", reason: "Second review round requested",
        }));
        expect(reload).toHaveBeenCalled();
    });

    test("a date beyond 90 days is refused before it is sent", async () => {
        render(<ExtendEmbargoDialog dataset={dataset} show onClose={jest.fn()} />);

        fireEvent.change(screen.getByLabelText("New end date"), { target: { value: "2027-01-15" } });
        fireEvent.click(screen.getByRole("button", { name: /Extend/ }));

        expect(await screen.findByText("An embargo can last at most 90 days.")).toBeTruthy();
        expect(extendEmbargo).not.toHaveBeenCalled();
    });
});

describe("EndEmbargoDialog", () => {
    test("states what ending early does, then ends it", async () => {
        endEmbargo.mockResolvedValue({ active: false });
        render(<EndEmbargoDialog dataset={dataset} show onClose={jest.fn()} />);

        expect(screen.getByText("Set to end Dec 15, 2026 · can't be undone")).toBeTruthy();
        expect(screen.getByText("Files open to Data Amazon members now")).toBeTruthy();
        expect(screen.getByText("Nothing becomes public until the DOI is promoted")).toBeTruthy();
        expect(screen.getByText("Anonymous links keep showing the redacted page until you publish")).toBeTruthy();
        expect(screen.getByText("3 people with access are emailed")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "End embargo" }));

        await waitFor(() => expect(endEmbargo).toHaveBeenCalledWith("d1"));
    });
});

describe("EmbargoModeDialog", () => {
    test("hiding says who stops seeing it", async () => {
        setEmbargoMode.mockResolvedValue({});
        render(<EmbargoModeDialog dataset={dataset} show onClose={jest.fn()} />);

        expect(screen.getByText("Hide from members?")).toBeTruthy();
        expect(screen.getByText("Administrators included")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Hide dataset" }));

        await waitFor(() => expect(setEmbargoMode).toHaveBeenCalledWith("d1", { metadata_visible: false }));
    });
});
