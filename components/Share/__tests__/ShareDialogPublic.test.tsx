/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const shareState: any = {
    owner: { id: "o", name: "Ana Souza", email: "ana@example.org" },
    permissions: [],
    invitations: [],
    anonymous_links: [],
    tenancy: { name: "Public", path: "datamap/production/public", members: 47, members_can_edit: false, is_default: true, is_legacy: false, datasets: 300 },
};

jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("swr", () => ({
    __esModule: true,
    default: () => ({ data: shareState, error: undefined, mutate: jest.fn() }),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn(async () => true), asPath: "/app/datasets/d3" }) }));
jest.mock("../../../lib/fetcher", () => ({ fetcher: jest.fn() }));
jest.mock("../ShareInput", () => ({ ShareInput: () => null }));

import { ShareDialog } from "../ShareDialog";

const publicDataset: any = { id: "d3", name: "Open aerosol optical depth", tenancy: "datamap/production/public", embargo: null, access: { level: "owner" } };

describe("ShareDialog in Public", () => {
    test("members are everyone on DataMap and there is nothing to change", () => {
        render(<ShareDialog dataset={publicDataset} show onClose={jest.fn()} />);

        expect(screen.getByText("Members of Public")).toBeTruthy();
        expect(screen.getByText("Everyone on DataMap · can read")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Change what members of Public can do" })).toBeNull();
    });
});
