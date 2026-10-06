/** @jest-environment jsdom */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const lookupInvitee = jest.fn() as any;
const inviteToWorkspace = jest.fn() as any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ lookupInvitee, inviteToWorkspace })),
}));

import { InviteMemberDialog } from "../InviteMemberDialog";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
const outsider = {
    user: { id: "u7", name: "Fernanda Lima", email: "fernanda.lima@inpe.br" },
    tenancy_member: false,
    invitation_pending: false,
    can_invite: true,
    datasets: 108,
};

function renderDialog() {
    const onClose = jest.fn();
    const onInvited = jest.fn();
    const view = render(<InviteMemberDialog tenancy={AMAZON} show onClose={onClose} onInvited={onInvited} />);
    const setShow = (show: boolean) =>
        view.rerender(<InviteMemberDialog tenancy={AMAZON} show={show} onClose={onClose} onInvited={onInvited} />);
    return { onClose, onInvited, setShow };
}

function type(text: string) {
    fireEvent.change(screen.getByLabelText("Email or ORCID iD"), { target: { value: text } });
}

async function settle() {
    await act(async () => { jest.advanceTimersByTime(300); });
    await act(async () => { await Promise.resolve(); });
}

async function flushMicrotasks() {
    for (let i = 0; i < 10; i++) {
        await Promise.resolve();
    }
}

function sendButton() {
    return screen.getByRole("button", { name: "Send invitation" }) as HTMLButtonElement;
}

beforeEach(() => {
    jest.useFakeTimers();
    lookupInvitee.mockReset().mockResolvedValue(outsider);
    inviteToWorkspace.mockReset();
});

afterEach(() => {
    jest.useRealTimers();
});

describe("InviteMemberDialog", () => {
    test("an exact email is looked up once typing settles, and the account found can be invited", async () => {
        renderDialog();

        expect(screen.getByRole("dialog", { name: "Invite to Data Amazon" })).toBeTruthy();
        type("fernanda.lima@inpe.br");
        expect(lookupInvitee).not.toHaveBeenCalled();
        await settle();

        expect(lookupInvitee).toHaveBeenCalledWith("datamap/production/data-amazon", "fernanda.lima@inpe.br");
        expect(screen.getByText("Fernanda Lima")).toBeTruthy();
        expect(screen.getByText("fernanda.lima@inpe.br")).toBeTruthy();
        expect(screen.getByText("Member of the tenancy · sees its 108 datasets once they accept · administrators are notified")).toBeTruthy();
        expect(sendButton().disabled).toBe(false);
    });

    test("an account found by ORCID iD shows the iD typed, since its email stays hidden", async () => {
        lookupInvitee.mockResolvedValue({ ...outsider, user: { ...outsider.user, email: null } });
        renderDialog();

        type("https://orcid.org/0000-0002-1825-0097");
        await settle();

        expect(lookupInvitee).toHaveBeenCalledWith("datamap/production/data-amazon", "0000-0002-1825-0097");
        expect(screen.getByText("ORCID iD 0000-0002-1825-0097")).toBeTruthy();
        expect(screen.queryByText(/@/)).toBeNull();
    });

    test("a member cannot be invited again, and the card says so", async () => {
        lookupInvitee.mockResolvedValue({ ...outsider, tenancy_member: true, can_invite: false });
        renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();

        expect(screen.getByText("Already a member of Data Amazon.")).toBeTruthy();
        expect(sendButton().disabled).toBe(true);
    });

    test("someone already invited cannot be invited twice", async () => {
        lookupInvitee.mockResolvedValue({ ...outsider, invitation_pending: true, can_invite: false });
        renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();

        expect(screen.getByText("Already invited to Data Amazon · not accepted yet.")).toBeTruthy();
        expect(sendButton().disabled).toBe(true);
    });

    test("no account behind the value says so", async () => {
        lookupInvitee.mockRejectedValue({ response: { status: 404, data: { detail: "no_account" } } });
        renderDialog();

        type("nobody@inpe.br");
        await settle();

        expect(screen.getByText("No DataMap account has this email or ORCID iD.")).toBeTruthy();
        expect(sendButton().disabled).toBe(true);
    });

    test("a name is not looked up, and the form asks for the full email or ORCID iD", async () => {
        renderDialog();

        type("Fernanda");
        await settle();
        await act(async () => {
            fireEvent.submit(screen.getByLabelText("Email or ORCID iD").closest("form") as HTMLFormElement);
        });

        expect(lookupInvitee).not.toHaveBeenCalled();
        expect(screen.getByText("Type the full email or ORCID iD.")).toBeTruthy();
    });

    test("Send invitation invites the account found, tells the page and closes", async () => {
        inviteToWorkspace.mockResolvedValue({ id: "ti1", can_withdraw: true });
        const { onClose, onInvited } = renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(sendButton());

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(inviteToWorkspace).toHaveBeenCalledWith("datamap/production/data-amazon", "u7");
        expect(onInvited).toHaveBeenCalledTimes(1);
    });

    test("a refusal says why and keeps the dialog open", async () => {
        inviteToWorkspace.mockRejectedValue({ response: { status: 409, data: { detail: "invitation_pending" } } });
        const { onClose } = renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(sendButton());

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This person already has an invitation to the tenancy waiting."));
        expect(onClose).not.toHaveBeenCalled();
    });

    test("submitting twice while the invitation is in flight sends only one invitation", async () => {
        let resolveInvite: (value: unknown) => void = () => {};
        inviteToWorkspace.mockImplementation(() => new Promise((resolve) => { resolveInvite = resolve; }));
        const { onClose, onInvited } = renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();

        const form = screen.getByLabelText("Email or ORCID iD").closest("form") as HTMLFormElement;
        await act(async () => {
            fireEvent.submit(form);
            fireEvent.submit(form);
        });

        expect(inviteToWorkspace).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveInvite({ id: "ti1", can_withdraw: true });
            await flushMicrotasks();
        });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onInvited).toHaveBeenCalledTimes(1);
    });

    test("Cancel, the close button and the input are disabled while the invitation is sending", async () => {
        let resolveInvite: (value: unknown) => void = () => {};
        inviteToWorkspace.mockImplementation(() => new Promise((resolve) => { resolveInvite = resolve; }));
        renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(sendButton());

        await waitFor(() => expect(inviteToWorkspace).toHaveBeenCalledTimes(1));
        expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole("button", { name: "Close" }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByLabelText("Email or ORCID iD") as HTMLInputElement).disabled).toBe(true);

        await act(async () => {
            resolveInvite({ id: "ti1", can_withdraw: true });
            await flushMicrotasks();
        });

        expect((screen.getByLabelText("Email or ORCID iD") as HTMLInputElement).disabled).toBe(false);
    });

    test("closing after a refusal and reopening the dialog shows no stale error", async () => {
        inviteToWorkspace.mockRejectedValue({ response: { status: 409, data: { detail: "invitation_pending" } } });
        const { setShow } = renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(sendButton());

        await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());

        setShow(false);
        setShow(true);

        expect(screen.queryByRole("alert")).toBeNull();
    });

    test("typing again clears a previous refusal", async () => {
        inviteToWorkspace.mockRejectedValue({ response: { status: 409, data: { detail: "invitation_pending" } } });
        renderDialog();

        type("fernanda.lima@inpe.br");
        await settle();
        fireEvent.click(sendButton());

        await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
        await waitFor(() => expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(false));

        type("fernanda.lima2@inpe.br");
        await act(async () => { await flushMicrotasks(); });

        expect(screen.queryByRole("alert")).toBeNull();
    });

    test("an ORCID lookup never shows an email, even if the server's response wrongly includes one", async () => {
        renderDialog();

        type("https://orcid.org/0000-0002-1825-0097");
        await settle();

        expect(screen.getByText("ORCID iD 0000-0002-1825-0097")).toBeTruthy();
        expect(screen.queryByText(/@/)).toBeNull();
    });
});
