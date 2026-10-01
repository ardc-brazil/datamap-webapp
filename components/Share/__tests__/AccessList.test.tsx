/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { AccessList } from "../AccessList";

const state: any = {
    owner: { id: "o", name: "Luciana Rizzo", email: "luciana.rizzo@usp.br" },
    permissions: [
        { user: { id: "u2", name: "Alan Calheiros", email: "alan.calheiros@inpe.br" }, level: "write", granted_at: "2026-09-09T10:00:00+00:00", granted_by: "o", invited_as: null },
        { user: { id: "u3", name: "Fernanda Lima", email: "fernanda.lima@gmail.com" }, level: "read", granted_at: "2026-09-29T10:00:00+00:00", granted_by: "o", invited_as: "fernanda@inpe.br" },
    ],
    invitations: [
        { id: "i1", email: "maria.oliveira@inpe.br", orcid: null, level: "read", created_at: "2026-09-28T10:00:00+00:00", accepted_at: null, accepted_by: null, revoked_at: null },
        { id: "i2", email: null, orcid: "0000-0002-1825-0097", level: "read", created_at: "2026-09-30T10:00:00+00:00", accepted_at: null, accepted_by: null, revoked_at: null },
        { id: "i3", email: "fernanda@inpe.br", orcid: null, level: "read", created_at: "2026-09-27T10:00:00+00:00", accepted_at: "2026-09-29T10:00:00+00:00", accepted_by: { id: "u3", name: "Fernanda Lima", email: "fernanda.lima@gmail.com" }, revoked_at: null },
        { id: "i4", email: "gone@uni.edu", orcid: null, level: "read", created_at: "2026-09-26T10:00:00+00:00", accepted_at: null, accepted_by: null, revoked_at: "2026-09-27T10:00:00+00:00" },
    ],
    anonymous_links: [],
    tenancy: null,
};

function renderList(overrides: any = {}, handlers: any = {}) {
    render(<AccessList
        state={{ ...state, ...overrides }}
        embargoActive
        onChangeLevel={handlers.onChangeLevel ?? jest.fn()}
        onRemove={handlers.onRemove ?? jest.fn()}
        onRevokeInvitation={handlers.onRevokeInvitation ?? jest.fn()}
    />);
}

describe("AccessList", () => {
    test("the owner, then each person with when they were added", () => {
        renderList();

        expect(screen.getByText("Luciana Rizzo")).toBeTruthy();
        expect(screen.getByText("Owner")).toBeTruthy();
        expect(screen.getByText("alan.calheiros@inpe.br · added Sep 9")).toBeTruthy();
    });

    test("someone who came through an invitation says which address it was sent to", () => {
        renderList();

        expect(screen.getByText("fernanda.lima@gmail.com · accepted the invitation sent to fernanda@inpe.br")).toBeTruthy();
    });

    test("pending invitations say whether DataMap sent them", () => {
        renderList();

        expect(screen.getByText("Invited Sep 28 · pending · email sent")).toBeTruthy();
        expect(screen.getByText("ORCID 0000-0002-1825-0097")).toBeTruthy();
        expect(screen.getByText("Invited Sep 30 · pending · link shown once, not sent by DataMap")).toBeTruthy();
    });

    test("accepted and revoked invitations are not listed again", () => {
        renderList();

        expect(screen.queryByText("gone@uni.edu")).toBeNull();
        expect(screen.queryByText("fernanda@inpe.br")).toBeNull();
    });

    test("the level menu changes a level and removes access", () => {
        const onChangeLevel = jest.fn();
        const onRemove = jest.fn();
        renderList({}, { onChangeLevel, onRemove });

        fireEvent.change(screen.getByLabelText("Access for Alan Calheiros"), { target: { value: "read" } });
        fireEvent.change(screen.getByLabelText("Access for Fernanda Lima"), { target: { value: "remove" } });

        expect(onChangeLevel).toHaveBeenCalledWith("u2", "read");
        expect(onRemove).toHaveBeenCalledWith(state.permissions[1]);
    });

    test("a pending invitation is revoked", () => {
        const onRevokeInvitation = jest.fn();
        renderList({}, { onRevokeInvitation });

        fireEvent.click(screen.getByRole("button", { name: "Revoke invitation for maria.oliveira@inpe.br" }));

        expect(onRevokeInvitation).toHaveBeenCalledWith("i1");
    });

    test("without an embargo the workspace is the first row", () => {
        renderList({ tenancy: { name: "Data Amazon", path: "datamap/production/data-amazon", members: 14 } });

        expect(screen.getByText("Members of Data Amazon")).toBeTruthy();
        expect(screen.getByText("14 people · workspace default")).toBeTruthy();
    });
});
