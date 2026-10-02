/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const acceptInvitation = jest.fn() as any;
const replace = jest.fn();

jest.mock("next-auth/react", () => ({ signOut: jest.fn() }));
jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ acceptInvitation })),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { replace: (url: string) => replace(url) } }));

import { InvitationCard } from "../InvitationCard";

const pending: any = {
    state: "pending", dataset_name: "GoAmazon 2014/5 — Aerosol size distribution, T3 site",
    inviter_name: "Luciana Rizzo", owner_name: "Luciana Rizzo", level: "read",
    invited_as: "fernanda@inpe.br", embargo_until: "2026-12-15T23:59:59+00:00", accepted_at: null,
};

describe("InvitationCard", () => {
    test("shows the invitation, and accepts it only when asked", async () => {
        acceptInvitation.mockResolvedValue({ dataset_id: "d1", level: "read" });
        render(<InvitationCard token="tok" preview={pending} account="fernanda.lima@gmail.com" />);

        expect(screen.getByRole("heading", { name: "Luciana Rizzo shared a dataset with you" })).toBeTruthy();
        expect(screen.getByText("Accepting gives this account read access, now and after the embargo.")).toBeTruthy();
        expect(screen.getByText("Can read and download")).toBeTruthy();
        expect(screen.getByText("fernanda@inpe.br")).toBeTruthy();
        expect(acceptInvitation).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Accept as fernanda.lima@gmail.com" }));

        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/datasets/d1"));
        expect(acceptInvitation).toHaveBeenCalledWith("tok");
    });

    test("without an embargo, the access is simply granted", () => {
        render(<InvitationCard token="tok" preview={{ ...pending, embargo_until: null, level: "write" }} account="a@b.c" />);

        expect(screen.getByText("Accepting gives this account write access.")).toBeTruthy();
        expect(screen.getByText("Can edit and download")).toBeTruthy();
    });

    test("used: when, and whom to ask", () => {
        render(<InvitationCard token="tok" preview={{ ...pending, state: "accepted", accepted_at: "2026-09-29T10:00:00Z" }} account={null} />);

        expect(screen.getByRole("heading", { name: "This invitation was already used" })).toBeTruthy();
        expect(screen.getByRole("status").textContent).toContain("It was accepted on Sep 29, 2026. If that was you, sign in to open the dataset. If it wasn't, ask Luciana Rizzo to revoke it and send a new one.");
    });

    test("accepted, seen signed in after the login round trip: accepted, and where the dataset is", () => {
        render(<InvitationCard token="tok" preview={{ ...pending, state: "accepted", accepted_at: "2026-09-29T10:00:00Z" }} account="fernanda.lima@gmail.com" />);

        expect(screen.getByRole("heading", { name: "Invitation accepted" })).toBeTruthy();
        expect(screen.queryByText(/already used/)).toBeNull();
        expect(screen.getByRole("link", { name: "Shared with me" }).getAttribute("href")).toBe("/app/datasets/shared");
    });

    test("accepted by someone else meanwhile: the used message", async () => {
        acceptInvitation.mockRejectedValue({ httpCode: 409 });
        render(<InvitationCard token="tok" preview={pending} account="a@b.c" />);

        fireEvent.click(screen.getByRole("button", { name: "Accept as a@b.c" }));

        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(screen.getByRole("alert").textContent).toContain("already used");
    });
});
