/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';

let shareState: any;

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

const dataset: any = { id: "d3", name: "Open aerosol optical depth", tenancy: "datamap/production/data-amazon", embargo: null, access: { level: "owner" } };

describe("ShareDialog when only the share state knows the tenancy is the default one", () => {
    test("members still read as Everyone on DataMap", () => {
        shareState = {
            owner: { id: "o", name: "Ana Souza", email: "ana@example.org" },
            permissions: [],
            invitations: [],
            anonymous_links: [],
            tenancy: { name: "Public", path: "datamap/production/data-amazon", members: 47, members_can_edit: true, is_default: true, is_legacy: false, datasets: 300 },
        };
        render(<ShareDialog dataset={dataset} show onClose={jest.fn()} />);

        expect(screen.getByText("Everyone on DataMap · can read")).toBeTruthy();
    });
});
