/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from "swr";

const update = jest.fn() as any;
const replace = jest.fn() as any;
const setTenancySelected = jest.fn() as any;
let answerTenancies: ((value: unknown) => void) | undefined;

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: { user: { name: "Fernanda Lima", tenancies: ["datamap/production/data-amazon"] } }, status: "authenticated", update }),
}));
jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: (...args: unknown[]) => replace(...args), push: jest.fn() },
}));
jest.mock("../../TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ tenancySelected: "", setTenancySelected }),
}));
jest.mock("../../../lib/fetcher", () => ({
    fetcher: (url: string) => url === "/api/tenancies"
        ? new Promise((resolve) => { answerTenancies = resolve; })
        : Promise.resolve([]),
}));
jest.mock("../../../gateways/BFFAPI", () => ({ BFFAPI: jest.fn().mockImplementation(() => ({})) }));
jest.mock("../../../lib/telemetryClient", () => ({ trackUiEvent: jest.fn() }));

import { TENANCIES_KEY } from "../../../contants/TenancyConstants";
import { TenancySelector } from "../TenancySelector";

const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

beforeEach(() => {
    update.mockReset();
    replace.mockReset();
    setTenancySelected.mockReset();
    answerTenancies = undefined;
});

describe("TenancySelector with a stale cached list", () => {
    test("a revoked lone tenancy still in the cache is not selected again", async () => {
        const cache = new Map<string, unknown>([[TENANCIES_KEY, { data: [AMAZON] }]]);
        render(
            <SWRConfig value={{ provider: () => cache as any, dedupingInterval: 0 }}>
                <TenancySelector />
            </SWRConfig>,
        );

        expect(setTenancySelected).not.toHaveBeenCalledWith(AMAZON.path);
        expect(replace).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();

        await waitFor(() => expect(answerTenancies).toBeDefined());
        expect(setTenancySelected).not.toHaveBeenCalledWith(AMAZON.path);
        await act(async () => { answerTenancies!([]); });

        expect(await screen.findByText("You're not in any tenancy")).toBeTruthy();
        expect(setTenancySelected).not.toHaveBeenCalledWith(AMAZON.path);
        expect(replace).not.toHaveBeenCalled();
    });
});
