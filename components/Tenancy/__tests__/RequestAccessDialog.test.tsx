/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const requestTenancyAccess = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ requestTenancyAccess })),
}));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));

import { mutate } from "swr";
import { RequestAccessDialog } from "../RequestAccessDialog";

async function send(name: string, reason: string) {
    fireEvent.change(screen.getByLabelText("Tenancy"), { target: { value: name } });
    fireEvent.change(screen.getByLabelText("Why"), { target: { value: reason } });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    });
}

beforeEach(() => {
    requestTenancyAccess.mockReset();
});

describe("RequestAccessDialog", () => {
    test("sends what the person typed, trimmed, refreshes the requests and closes", async () => {
        requestTenancyAccess.mockResolvedValue({ id: "r1", status: "pending" });
        const onClose = jest.fn();
        render(<RequestAccessDialog show onClose={onClose} />);

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
        expect(screen.getByText("Name the tenancy you need. An administrator reviews it; you're emailed with the answer.")).toBeTruthy();
        expect(screen.getByText("The name of the group or project. If it exists, this is a request to join; if not, a request to create it. Only administrators can tell which.")).toBeTruthy();
        await send("  Data Amazon ", " I'm a postdoc working on the GoAmazon SMPS data. ");

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(requestTenancyAccess).toHaveBeenCalledWith({ tenancyName: "Data Amazon", reason: "I'm a postdoc working on the GoAmazon SMPS data." });
        expect(mutate).toHaveBeenCalledWith("/api/tenancy-requests");
    });

    test("empty fields are refused before anything is sent", async () => {
        render(<RequestAccessDialog show onClose={jest.fn()} />);

        await send("   ", "");

        expect(await screen.findByText("Name the tenancy you need.")).toBeTruthy();
        expect(screen.getByText("Say why you need access.")).toBeTruthy();
        expect(requestTenancyAccess).not.toHaveBeenCalled();
    });

    test("each field is described by its hint and its own error", async () => {
        render(<RequestAccessDialog show onClose={jest.fn()} />);
        const describedBy = (element: HTMLElement) => (element.getAttribute("aria-describedby") ?? "")
            .split(" ").filter(Boolean).map((id) => document.getElementById(id)?.textContent);

        expect(describedBy(screen.getByLabelText("Why"))).toEqual([]);
        await send("   ", "");

        await screen.findByText("Name the tenancy you need.");
        expect(describedBy(screen.getByLabelText("Tenancy"))).toEqual([
            "The name of the group or project. If it exists, this is a request to join; if not, a request to create it. Only administrators can tell which.",
            "Name the tenancy you need.",
        ]);
        expect(describedBy(screen.getByLabelText("Why"))).toEqual(["Say why you need access."]);
    });

    test("a request already waiting says to withdraw it first", async () => {
        requestTenancyAccess.mockRejectedValue({ response: { status: 409, data: { detail: "request_pending" } } });
        const onClose = jest.fn();
        render(<RequestAccessDialog show onClose={onClose} />);

        await send("Data Amazon", "SMPS data");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("You already have a request waiting. Withdraw it to send another."));
        expect(onClose).not.toHaveBeenCalled();
    });

    test("the daily limit says when to try again", async () => {
        requestTenancyAccess.mockRejectedValue({ response: { status: 429, data: { detail: "too_many_requests" } } });
        render(<RequestAccessDialog show onClose={jest.fn()} />);

        await send("Data Amazon", "SMPS data");

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("You have sent three requests in the last 24 hours. Try again tomorrow."));
    });

    test("Cancel closes without sending", () => {
        const onClose = jest.fn();
        render(<RequestAccessDialog show onClose={onClose} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(requestTenancyAccess).not.toHaveBeenCalled();
    });
});
