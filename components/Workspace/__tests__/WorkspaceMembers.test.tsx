/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const setSize = jest.fn() as any;
const mutate = jest.fn() as any;
const membersCalls: unknown[] = [];
let pageTenancy: any;
let members: any;

jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: (...args: unknown[]) => mutate(...args) }));
jest.mock("../../../hooks/UseWorkspace", () => ({
    useMembersPageTenancy: () => pageTenancy,
    useWorkspaceMembers: (tenancy: unknown) => {
        membersCalls.push(tenancy);
        return { ...members, size: 1, setSize, isValidating: false };
    },
}));
jest.mock("../WorkspaceInvitations", () => {
    const React = require("react");
    return { WorkspaceInvitations: (props: any) => React.createElement("p", null, `invitations of ${props.tenancy.display_name}`) };
});
jest.mock("../InviteMemberDialog", () => {
    const React = require("react");
    return {
        InviteMemberDialog: (props: any) => props.show
            ? React.createElement("div", null,
                `inviting to ${props.tenancy.display_name}`,
                React.createElement("button", { type: "button", onClick: props.onInvited }, "stub invited"))
            : null,
    };
});

import { NO_MEMBERS_PAGE, WorkspaceMembers } from "../WorkspaceMembers";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function membersPage(items: unknown[], total = items.length) {
    return [{ items, total_count: total, limit: 50, offset: 0 }];
}

function someMembers(count: number, from = 0) {
    return Array.from({ length: count }, (_, i) => ({ id: `m${from + i}`, name: `Member ${from + i}`, orcid: null }));
}

beforeEach(() => {
    setSize.mockReset();
    mutate.mockReset();
    membersCalls.length = 0;
    pageTenancy = { tenancy: AMAZON, loading: false, error: undefined };
    members = {
        data: membersPage([
            { id: "m1", name: "Luciana Rizzo", orcid: "0000-0002-1825-0097" },
            { id: "m2", name: "Marcia Yamasoe", orcid: null },
        ]),
    };
});

describe("WorkspaceMembers", () => {
    test("lists the members by name with their ORCID iD, and never an email", () => {
        const { container } = render(<WorkspaceMembers />);

        expect(screen.getByRole("heading", { name: "Members" })).toBeTruthy();
        expect(screen.getByText("datamap/production/data-amazon")).toBeTruthy();
        expect(screen.getByText("Members · 2")).toBeTruthy();
        expect(screen.getByText("Luciana Rizzo")).toBeTruthy();
        expect(screen.getByText("0000-0002-1825-0097")).toBeTruthy();
        expect(screen.getByText("Marcia Yamasoe")).toBeTruthy();
        expect(screen.getByText("invitations of Data Amazon")).toBeTruthy();
        expect(container.textContent).not.toContain("@");
        expect(membersCalls).toEqual(["datamap/production/data-amazon"]);
    });

    test("more than 50 members load 50 more at a time", () => {
        members = { data: membersPage(Array.from({ length: 50 }, (_, i) => ({ id: `m${i}`, name: `Member ${i}`, orcid: null })), 120) };
        render(<WorkspaceMembers />);

        fireEvent.click(screen.getByRole("button", { name: "Show 50 more" }));

        expect(setSize).toHaveBeenCalledWith(2);
    });

    test("every member loaded leaves nothing more to show", () => {
        members = { data: membersPage(someMembers(50), 50) };
        render(<WorkspaceMembers />);

        expect(screen.queryByRole("button", { name: /^Show \d+ more$/ })).toBeNull();
    });

    test("the last page offers only the members left", () => {
        members = { data: [...membersPage(someMembers(50), 120), { items: someMembers(50, 50), total_count: 120, limit: 50, offset: 50 }] };
        render(<WorkspaceMembers />);

        expect(screen.getByRole("button", { name: "Show 20 more" })).toBeTruthy();
    });

    test("a later page that cannot load keeps the members already loaded and says why below them", () => {
        members = { data: membersPage(someMembers(50), 120), error: { status: 500, detail: "unavailable" } };
        render(<WorkspaceMembers />);

        expect(screen.getByText("Member 0")).toBeTruthy();
        expect(screen.getByText("Member 49")).toBeTruthy();
        const alert = screen.getByRole("alert");
        expect(alert.textContent).toBe("Something went wrong. Please try again.");
        expect(screen.getByRole("list").compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test("a members list refused with a 409 says why", () => {
        members = { error: { status: 409, detail: "public_tenancy_locked" } };
        render(<WorkspaceMembers />);

        expect(screen.getByRole("alert").textContent).toBe("Everyone on DataMap is in Public, so it has no Members page.");
    });

    test("tenancies that cannot load say so, rather than that the tenancy has no Members page", () => {
        pageTenancy = { tenancy: null, loading: false, error: { status: 500, detail: "unavailable" } };
        render(<WorkspaceMembers />);

        expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again.");
        expect(screen.queryByText(NO_MEMBERS_PAGE)).toBeNull();
        expect(screen.queryByRole("button", { name: "+ Invite" })).toBeNull();
    });

    test("Public, a legacy tenancy or a tenancy the user is not in has no Members page and nothing to invite to", () => {
        pageTenancy = { tenancy: null, loading: false, error: undefined };
        render(<WorkspaceMembers />);

        expect(screen.getByText(NO_MEMBERS_PAGE)).toBeTruthy();
        expect(screen.queryByRole("button", { name: "+ Invite" })).toBeNull();
        expect(membersCalls).toEqual([]);
    });

    test("+ Invite opens the dialog for the tenancy, and an invitation refreshes the pending list", () => {
        render(<WorkspaceMembers />);

        fireEvent.click(screen.getByRole("button", { name: "+ Invite" }));
        fireEvent.click(screen.getByRole("button", { name: "stub invited" }));

        expect(screen.getByText("inviting to Data Amazon")).toBeTruthy();
        expect(mutate).toHaveBeenCalledWith("/api/workspace/invitations?tenancy=datamap%2Fproduction%2Fdata-amazon");
    });

    test("a list that cannot load says why", () => {
        members = { error: { status: 404, detail: "tenancy_not_found" } };
        render(<WorkspaceMembers />);

        expect(screen.getByRole("alert").textContent).toBe("You are not a member of this tenancy.");
    });

    test("waits for the user's tenancies before deciding", () => {
        pageTenancy = { tenancy: null, loading: true, error: undefined };
        render(<WorkspaceMembers />);

        expect(screen.getByRole("status").textContent).toBe("Loading…");
        expect(screen.queryByText(NO_MEMBERS_PAGE)).toBeNull();
    });
});
