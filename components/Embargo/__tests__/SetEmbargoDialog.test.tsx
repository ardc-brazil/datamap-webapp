/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const setEmbargo = jest.fn() as any;
const setMembersAccess = jest.fn() as any;
const reload = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ reload }) }));
jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ setEmbargo, setMembersAccess })),
}));

import { SetEmbargoDialog } from "../SetEmbargoDialog";

const dataset: any = { id: "d1", tenancy: "datamap/production/data-amazon", embargo: null, members_can_edit: true };

beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-01T10:00:00Z"), doNotFake: ["setTimeout", "setInterval", "queueMicrotask", "nextTick"] });
    setEmbargo.mockReset();
    setMembersAccess.mockReset();
    setEmbargo.mockResolvedValue({ active: true });
    setMembersAccess.mockResolvedValue({ members_can_edit: false });
});

function pickDate() {
    fireEvent.change(screen.getByLabelText("Embargo ends"), { target: { value: "2026-11-15" } });
}

describe("SetEmbargoDialog", () => {
    test("a changed members' setting is sent first, then the embargo", async () => {
        render(<SetEmbargoDialog dataset={dataset} show onClose={jest.fn()} />);
        pickDate();

        fireEvent.click(screen.getByRole("button", { name: "Change what members of Data Amazon can do" }));
        await act(async () => {
            fireEvent.click(screen.getByRole("radio", { name: /Read only/ }));
            fireEvent.click(screen.getByRole("button", { name: "Save" }));
        });
        expect(screen.getByText("When the embargo ends, members of Data Amazon can read but not edit.")).toBeTruthy();
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Set embargo" }));
        });

        await waitFor(() => expect(setEmbargo).toHaveBeenCalled());
        expect(setMembersAccess).toHaveBeenCalledWith("d1", { members_can_edit: false });
        expect(setMembersAccess.mock.invocationCallOrder[0]).toBeLessThan(setEmbargo.mock.invocationCallOrder[0]);
    });

    test("an unchanged setting sends only the embargo", async () => {
        render(<SetEmbargoDialog dataset={dataset} show onClose={jest.fn()} />);
        pickDate();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Set embargo" }));
        });

        await waitFor(() => expect(setEmbargo).toHaveBeenCalledWith("d1", {
            until: "2026-11-15T23:59:59+00:00",
            metadata_visible: false,
            note: null,
        }));
        expect(setMembersAccess).not.toHaveBeenCalled();
    });

    test("after a failed embargo, flipping the members' setting back sends it again on the retry", async () => {
        setEmbargo.mockRejectedValueOnce({ httpCode: 400, errors: [{ code: "embargo_until_in_past" }] });
        render(<SetEmbargoDialog dataset={dataset} show onClose={jest.fn()} />);
        pickDate();

        fireEvent.click(screen.getByRole("button", { name: "Change what members of Data Amazon can do" }));
        await act(async () => {
            fireEvent.click(screen.getByRole("radio", { name: /Read only/ }));
            fireEvent.click(screen.getByRole("button", { name: "Save" }));
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Set embargo" }));
        });
        await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
        expect(setMembersAccess).toHaveBeenCalledTimes(1);
        expect(setMembersAccess).toHaveBeenCalledWith("d1", { members_can_edit: false });

        fireEvent.click(screen.getByRole("button", { name: "Change what members of Data Amazon can do" }));
        await act(async () => {
            fireEvent.click(screen.getByRole("radio", { name: /Read and edit/ }));
            fireEvent.click(screen.getByRole("button", { name: "Save" }));
        });
        expect(screen.getByText("When the embargo ends, members of Data Amazon can read and edit again.")).toBeTruthy();
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Set embargo" }));
        });

        await waitFor(() => expect(setEmbargo).toHaveBeenCalledTimes(2));
        expect(setMembersAccess).toHaveBeenCalledTimes(2);
        expect(setMembersAccess).toHaveBeenLastCalledWith("d1", { members_can_edit: true });
        expect(setMembersAccess.mock.invocationCallOrder[1]).toBeLessThan(setEmbargo.mock.invocationCallOrder[1]);
    });

    test("a dataset already read-only starts from read-only", () => {
        render(<SetEmbargoDialog dataset={{ ...dataset, members_can_edit: false }} show onClose={jest.fn()} />);

        expect(screen.getByText("When the embargo ends, members of Data Amazon can read but not edit.")).toBeTruthy();
    });

    test("a Public dataset reads members as read-only, even with a stale members_can_edit, and hides Change", () => {
        render(<SetEmbargoDialog dataset={{ ...dataset, tenancy: "datamap/production/public", members_can_edit: true }} show onClose={jest.fn()} />);

        expect(screen.getByText("When the embargo ends, members of Public can read but not edit.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Change what members/ })).toBeNull();
    });
});
