/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

let mockMembersTenancy: unknown = null;
let mockPathname = "/app/home";

jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: jest.fn() },
    useRouter: () => ({ pathname: mockPathname }),
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({
        isTenancySelected: () => true,
        tenancySelected: "datamap/production/data-amazon",
    }),
}));
jest.mock("../../Profile/AvatarButton", () => ({ __esModule: true, default: () => null }));
jest.mock("../../../hooks/UseWorkspace", () => ({
    useMembersPageTenancy: () => ({ tenancy: mockMembersTenancy, loading: false }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { name: "Ada", admin: false } } }) }));

import LoggedLayout from "../../LoggedLayout";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    mockMembersTenancy = AMAZON;
    mockPathname = "/app/home";
});

describe("the sidebar Members entry", () => {
    test("a member of a tenancy open to members gets it", () => {
        render(<LoggedLayout><p>page</p></LoggedLayout>);

        expect(screen.getByRole("link", { name: /Members/ }).getAttribute("href")).toBe("/app/members");
    });

    test("Public, a legacy tenancy or one the user is not in has none", () => {
        mockMembersTenancy = null;
        render(<LoggedLayout><p>page</p></LoggedLayout>);

        expect(screen.queryByRole("link", { name: /Members/ })).toBeNull();
    });

    test("is marked on the Members page", () => {
        mockPathname = "/app/members";
        render(<LoggedLayout><p>page</p></LoggedLayout>);

        expect(screen.getByRole("link", { name: /Members/ }).className).toContain("bg-secondary-500");
    });
});
