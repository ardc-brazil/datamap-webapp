/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

const push = jest.fn() as any;
let session: any;
let mockMembersTenancy: unknown = null;

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: session, status: "authenticated" }),
    signOut: jest.fn(),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (...args: unknown[]) => push(...args) } }));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: "datamap/production/public" }),
}));
jest.mock("../../../hooks/UseWorkspace", () => ({
    useMembersPageTenancy: () => ({ tenancy: mockMembersTenancy, loading: false }),
}));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("swr", () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));

import AvatarButton from "../AvatarButton";

function openMenu() {
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
}

beforeEach(() => {
    push.mockReset();
    session = { user: { name: "Fernanda Lima", email: "fernanda@inpe.br", image: null, tenancies: ["datamap/production/public"] } };
    mockMembersTenancy = null;
});

describe("AvatarButton", () => {
    test("with one tenancy there is nothing to switch to, and access can be requested", () => {
        render(<AvatarButton />);
        openMenu();

        expect(screen.queryByRole("menuitem", { name: /Switch tenancy/ })).toBeNull();
        expect(screen.getByRole("menuitem", { name: /Request access to a tenancy/ })).toBeTruthy();
    });

    test("with more than one, Switch tenancy opens the selector", () => {
        session.user.tenancies = ["datamap/production/public", "datamap/production/data-amazon"];
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Switch tenancy/ }));

        expect(push).toHaveBeenCalledWith("/app/tenancy");
    });

    test("Request access to a tenancy opens the form", () => {
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Request access to a tenancy/ }));

        expect(screen.getByRole("dialog", { name: "Request access" })).toBeTruthy();
    });

    test("a tenancy open to members gets a Members item", () => {
        mockMembersTenancy = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
        render(<AvatarButton />);
        openMenu();

        expect(screen.getByRole("menuitem", { name: /Members/ })).toBeTruthy();
    });

    test("Public, legacy, or no tenancy at all has no Members item", () => {
        render(<AvatarButton />);
        openMenu();

        expect(screen.queryByRole("menuitem", { name: /Members/ })).toBeNull();
    });

    test("Members pushes the Members page", () => {
        mockMembersTenancy = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };
        render(<AvatarButton />);
        openMenu();

        fireEvent.click(screen.getByRole("menuitem", { name: /Members/ }));

        expect(push).toHaveBeenCalledWith("/app/members");
    });
});
