/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const setMembersAccess = jest.fn() as any;
const replace = jest.fn(async () => true);
const mutate = jest.fn(async () => undefined);
let shareState: any;

jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({ setMembersAccess })) }));
jest.mock("swr", () => ({ __esModule: true, default: () => ({ data: shareState, error: undefined, mutate }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ replace, asPath: "/app/datasets/d1" }) }));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));

import { AccessSummary } from "../AccessSummary";

const owner = { level: "owner", can_edit: true, can_share: true, can_manage_embargo: true, can_extend_embargo: false, can_delete: true };

function stateWith(tenancy: any) {
    return {
        owner: { id: "o", name: "Luciana Rizzo", email: "l@usp.br" },
        permissions: [{ user: { id: "u2", name: "Alan Calheiros", email: "a@inpe.br" }, level: "write" }],
        invitations: [],
        anonymous_links: [],
        tenancy,
    };
}

describe("AccessSummary", () => {
    test("the people, then what members of the workspace can do", () => {
        shareState = stateWith({ name: "Data Amazon", path: "datamap/production/data-amazon", members: 14, members_can_edit: true });
        render(<AccessSummary dataset={{ id: "d1", tenancy: "datamap/production/data-amazon", access: owner, embargo: null, members_can_edit: true } as any} />);

        expect(screen.getByText("Luciana Rizzo, Alan Calheiros (write)")).toBeTruthy();
        expect(screen.getByText("Members of Data Amazon")).toBeTruthy();
        expect(screen.getByText("14 people · can read and edit")).toBeTruthy();
    });

    test("the owner changes it from Settings", async () => {
        shareState = stateWith({ name: "Data Amazon", path: "datamap/production/data-amazon", members: 14, members_can_edit: true });
        setMembersAccess.mockResolvedValue({ members_can_edit: false, access: owner });
        render(<AccessSummary dataset={{ id: "d1", tenancy: "datamap/production/data-amazon", access: owner, embargo: null, members_can_edit: true } as any} />);

        fireEvent.click(screen.getByRole("button", { name: "Change what members of Data Amazon can do" }));
        fireEvent.click(screen.getByRole("radio", { name: /Read only/ }));
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => expect(setMembersAccess).toHaveBeenCalledWith("d1", { members_can_edit: false }));
        await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/datasets/d1", undefined, { scroll: false }));
        expect(mutate).toHaveBeenCalled();
    });

    test("during an embargo it says what members get afterwards", () => {
        shareState = stateWith(null);
        render(<AccessSummary dataset={{ id: "d1", tenancy: "datamap/production/data-amazon", access: owner, embargo: { active: true, until: "2026-12-15T23:59:59+00:00" }, members_can_edit: false } as any} />);

        expect(screen.getByText("No access during the embargo · afterwards: read only")).toBeTruthy();
    });

    test("a write holder reads it and cannot change it", () => {
        shareState = stateWith({ name: "Data Amazon", path: "datamap/production/data-amazon", members: 14, members_can_edit: false });
        render(<AccessSummary dataset={{ id: "d1", tenancy: "datamap/production/data-amazon", access: { ...owner, level: "write", can_manage_embargo: false }, embargo: null } as any} />);

        expect(screen.getByText("14 people · can read · editing limited to the people above")).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Change what members/ })).toBeNull();
    });
});
