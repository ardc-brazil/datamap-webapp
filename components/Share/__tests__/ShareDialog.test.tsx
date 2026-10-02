/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const grantAccess = jest.fn() as any;
const createAnonymousLink = jest.fn() as any;
const revokePermission = jest.fn() as any;
const revokeAnonymousLink = jest.fn() as any;
const searchShareCandidates = jest.fn() as any;
const setMembersAccess = jest.fn() as any;
const replace = jest.fn(async () => true);
const mutate = jest.fn();
let shareState: any;

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ grantAccess, createAnonymousLink, revokePermission, revokeAnonymousLink, searchShareCandidates, setMembersAccess })),
}));
jest.mock("swr", () => ({
    __esModule: true,
    default: () => ({ data: shareState, error: undefined, mutate }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ replace, asPath: "/app/datasets/d2" }) }));
jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import { ShareDialog } from "../ShareDialog";

const embargoed: any = { id: "d1", name: "GoAmazon 2014/5", tenancy: "datamap/production/data-amazon", embargo: { active: true, until: "2026-12-15T23:59:59+00:00" } };
const open: any = { id: "d2", name: "Manaus Radar Reflectivity 2023", tenancy: "datamap/production/data-amazon", embargo: null };

function stateWith(overrides: any = {}) {
    return {
        owner: { id: "o", name: "Luciana Rizzo", email: "luciana.rizzo@usp.br" },
        permissions: [{ user: { id: "u2", name: "Alan Calheiros", email: "alan@inpe.br" }, level: "write", granted_at: "2026-09-09T10:00:00+00:00", granted_by: "o", invited_as: null }],
        invitations: [],
        anonymous_links: [],
        tenancy: null,
        ...overrides,
    };
}

describe("ShareDialog", () => {
    test("under embargo: anonymous links, and the footer says access continues", () => {
        shareState = stateWith();
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        expect(screen.getByRole("dialog", { name: "Share" })).toBeTruthy();
        expect(screen.getByText("GoAmazon 2014/5")).toBeTruthy();
        expect(screen.getByText("Anonymous links")).toBeTruthy();
        expect(screen.getByText("Access continues after the embargo ends")).toBeTruthy();
    });

    test("without an embargo: no anonymous links, and the footer says when they exist", () => {
        shareState = stateWith({ tenancy: { name: "Data Amazon", path: "x", members: 14 } });
        render(<ShareDialog dataset={open} show onClose={jest.fn()} />);

        expect(screen.getByText("Manaus Radar Reflectivity 2023 · not under embargo")).toBeTruthy();
        expect(screen.queryByText("Anonymous links")).toBeNull();
        expect(screen.getByText("Anonymous links are available under embargo")).toBeTruthy();
    });

    test("an ORCID invitation shows its link once", async () => {
        shareState = stateWith();
        grantAccess.mockResolvedValue({ kind: "invitation", invitation: { id: "i1", email: null }, link: "https://datamap.pcs.usp.br/invitations/tok" });
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.change(screen.getByLabelText("Add people by name, email or ORCID"), { target: { value: "0000-0002-1825-0097" } });
        fireEvent.click(screen.getByRole("button", { name: /Invite ORCID/ }));

        expect(await screen.findByText("Copy the link now")).toBeTruthy();
        expect(screen.getByDisplayValue("https://datamap.pcs.usp.br/invitations/tok")).toBeTruthy();
        await waitFor(() => expect(mutate).toHaveBeenCalled());
    });

    test("an emailed invitation needs no link to copy", async () => {
        shareState = stateWith();
        grantAccess.mockResolvedValue({ kind: "invitation", invitation: { id: "i1", email: "joao@inpe.br" }, link: "https://datamap.pcs.usp.br/invitations/tok" });
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.change(screen.getByLabelText("Add people by name, email or ORCID"), { target: { value: "joao@inpe.br" } });
        fireEvent.click(screen.getByRole("button", { name: /Invite joao@inpe.br/ }));

        await waitFor(() => expect(mutate).toHaveBeenCalled());
        expect(screen.queryByText("Copy the link now")).toBeNull();
    });

    test("a new anonymous link warns about free text, then is shown once", async () => {
        shareState = stateWith();
        createAnonymousLink.mockResolvedValue({ id: "r1", link: "https://datamap.pcs.usp.br/anonymous/tok" });
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "New anonymous link" }));
        expect(screen.getByText("Free text isn't redacted — check the description for names.")).toBeTruthy();
        fireEvent.change(screen.getByLabelText(/Label/), { target: { value: "JGR Atmospheres, round 2" } });
        fireEvent.click(screen.getByRole("button", { name: "Create link" }));

        await waitFor(() => expect(createAnonymousLink).toHaveBeenCalledWith("d1", "JGR Atmospheres, round 2"));
        expect(await screen.findByDisplayValue("https://datamap.pcs.usp.br/anonymous/tok")).toBeTruthy();
        expect(screen.getByText("Works until the dataset is published, then leads to the public page · view count shown in Share, viewers stay anonymous")).toBeTruthy();
    });

    test("a second click on Create link while the request is in flight sends only one", async () => {
        shareState = stateWith();
        let resolve: (value: unknown) => void;
        createAnonymousLink.mockReturnValue(new Promise((r) => { resolve = r; }));
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "New anonymous link" }));
        fireEvent.change(screen.getByLabelText(/Label/), { target: { value: "JGR Atmospheres, round 2" } });
        const createButton = screen.getByRole("button", { name: "Create link" });
        fireEvent.click(createButton);
        fireEvent.click(createButton);

        expect(createAnonymousLink).toHaveBeenCalledTimes(1);
        expect((createButton as HTMLButtonElement).disabled).toBe(true);
        resolve({ id: "r1", link: "https://datamap.pcs.usp.br/anonymous/tok" });
        await waitFor(() => expect(mutate).toHaveBeenCalled());
    });

    test("removing access asks first and says what happens", async () => {
        shareState = stateWith();
        revokePermission.mockResolvedValue(undefined);
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.change(screen.getByLabelText("Access for Alan Calheiros"), { target: { value: "remove" } });
        expect(screen.getByText("Existing download links expire within 1 hour")).toBeTruthy();
        expect(screen.getByText("No notification is sent")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Remove access" }));

        await waitFor(() => expect(revokePermission).toHaveBeenCalledWith("d1", "u2"));
    });

    test("while removing access is pending, the confirm is disabled, other actions are dropped, and the dialog stays open until it resolves", async () => {
        shareState = stateWith({
            anonymous_links: [{ id: "r1", label: "Reviewers", token_hint: null, created_at: "2026-09-20T10:00:00+00:00", revoked_at: null, views: { count: 0, first_at: null, last_at: null } }],
        });
        let resolve: (value: unknown) => void;
        revokePermission.mockReturnValue(new Promise((r) => { resolve = r; }));
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.change(screen.getByLabelText("Access for Alan Calheiros"), { target: { value: "remove" } });
        const confirmButton = screen.getByRole("button", { name: "Remove access" });
        fireEvent.click(confirmButton);
        fireEvent.click(confirmButton);

        expect(revokePermission).toHaveBeenCalledTimes(1);
        expect((confirmButton as HTMLButtonElement).disabled).toBe(true);

        fireEvent.click(screen.getByRole("button", { name: "Revoke Reviewers" }));
        expect(revokeAnonymousLink).not.toHaveBeenCalled();
        expect(screen.getByRole("dialog", { name: "Remove access?" })).toBeTruthy();

        resolve(undefined);
        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Remove access?" })).toBeNull());
    });

    test("a refusal is shown in words", async () => {
        shareState = stateWith();
        grantAccess.mockRejectedValue({ httpCode: 400, errors: [{ code: "already_has_access" }] });
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.change(screen.getByLabelText("Add people by name, email or ORCID"), { target: { value: "joao@inpe.br" } });
        fireEvent.click(screen.getByRole("button", { name: /Invite joao@inpe.br/ }));

        expect(await screen.findByText("This person already has access.")).toBeTruthy();
    });

    test("a refused grant keeps what was typed, so it can be corrected", async () => {
        shareState = stateWith();
        grantAccess.mockRejectedValue({ httpCode: 400, errors: [{ code: "invalid_email" }] });
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.change(screen.getByLabelText("Add people by name, email or ORCID"), { target: { value: "joao@inpe.br" } });
        fireEvent.click(screen.getByRole("button", { name: /Invite joao@inpe.br/ }));

        expect(await screen.findByText("This email address is not valid.")).toBeTruthy();
        expect((screen.getByLabelText("Add people by name, email or ORCID") as HTMLInputElement).value).toBe("joao@inpe.br");
    });

    test("a granted invitation clears the input", async () => {
        shareState = stateWith();
        grantAccess.mockResolvedValue({ kind: "invitation", invitation: { id: "i1", email: "joao@inpe.br" }, link: "x" });
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.change(screen.getByLabelText("Add people by name, email or ORCID"), { target: { value: "joao@inpe.br" } });
        fireEvent.click(screen.getByRole("button", { name: /Invite joao@inpe.br/ }));

        await waitFor(() => expect((screen.getByLabelText("Add people by name, email or ORCID") as HTMLInputElement).value).toBe(""));
    });

    test("an error does not survive closing the dialog", async () => {
        shareState = stateWith();
        grantAccess.mockRejectedValue({ httpCode: 400, errors: [{ code: "already_has_access" }] });
        const onClose = jest.fn();
        const { rerender } = render(<ShareDialog dataset={embargoed} show onClose={onClose} />);

        fireEvent.change(screen.getByLabelText("Add people by name, email or ORCID"), { target: { value: "joao@inpe.br" } });
        fireEvent.click(screen.getByRole("button", { name: /Invite joao@inpe.br/ }));
        expect(await screen.findByText("This person already has access.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(onClose).toHaveBeenCalled();
        rerender(<ShareDialog dataset={embargoed} show={false} onClose={onClose} />);
        rerender(<ShareDialog dataset={embargoed} show onClose={onClose} />);

        expect(screen.queryByText("This person already has access.")).toBeNull();
    });

    test("Create link waits for a label", () => {
        shareState = stateWith();
        render(<ShareDialog dataset={embargoed} show onClose={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "New anonymous link" }));
        const createButton = screen.getByRole("button", { name: "Create link" }) as HTMLButtonElement;
        expect(createButton.disabled).toBe(true);

        fireEvent.change(screen.getByLabelText(/Label/), { target: { value: "   " } });
        expect(createButton.disabled).toBe(true);

        fireEvent.change(screen.getByLabelText(/Label/), { target: { value: "Reviewers" } });
        expect(createButton.disabled).toBe(false);
    });

    test("without an embargo the owner changes what members can do", async () => {
        shareState = stateWith({ tenancy: { name: "Data Amazon", path: "datamap/production/data-amazon", members: 14, members_can_edit: true } });
        setMembersAccess.mockResolvedValue({ members_can_edit: false, access: { level: "owner" } });
        render(<ShareDialog dataset={{ ...open, access: { level: "owner" }, members_can_edit: true }} show onClose={jest.fn()} />);

        expect(screen.getByText("14 people · can read and edit")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Change what members of Data Amazon can do" }));
        fireEvent.click(screen.getByRole("radio", { name: /Read only/ }));
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => expect(setMembersAccess).toHaveBeenCalledWith("d2", { members_can_edit: false }));
        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/datasets/d2", undefined, { scroll: false }));
        expect(mutate).toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByRole("dialog", { name: "What members of Data Amazon can do" })).toBeNull());
        expect(screen.getByRole("dialog", { name: "Share" })).toBeTruthy();
    });

    test("during an embargo the row says what members get afterwards", () => {
        shareState = stateWith({ tenancy: null });
        render(<ShareDialog dataset={{ ...embargoed, access: { level: "owner" }, members_can_edit: false }} show onClose={jest.fn()} />);

        expect(screen.getByText("No access during the embargo · afterwards: read only")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Change what members of Data Amazon can do" })).toBeTruthy();
    });

    test("someone who is not the owner reads the row and cannot change it", () => {
        shareState = stateWith({ tenancy: { name: "Data Amazon", path: "datamap/production/data-amazon", members: 14, members_can_edit: false } });
        render(<ShareDialog dataset={{ ...open, access: { level: "write" } }} show onClose={jest.fn()} />);

        expect(screen.getByText("14 people · can read · editing limited to the people above")).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Change what members/ })).toBeNull();
    });

    test("a refused change is shown in the members dialog", async () => {
        shareState = stateWith({ tenancy: { name: "Data Amazon", path: "datamap/production/data-amazon", members: 14, members_can_edit: true } });
        setMembersAccess.mockRejectedValue({ httpCode: 403 });
        render(<ShareDialog dataset={{ ...open, access: { level: "owner" } }} show onClose={jest.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Change what members of Data Amazon can do" }));
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(await screen.findByText("You are not allowed to do this on this dataset.")).toBeTruthy();
    });
});
