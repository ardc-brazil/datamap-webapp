/** @jest-environment jsdom */
import { expect, jest, test } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const calls: string[] = [];
const setTenancySelected = jest.fn((path: string) => { calls.push(`select ${path}`); });
const push = jest.fn((route: string) => { calls.push(`push ${route}`); });
const trackUiEvent = jest.fn((name: string) => { calls.push(`track ${name}`); });

jest.mock("../../components/TenancyStore", () => ({
    useTenancyStore: (selector: (state: unknown) => unknown) => selector({ setTenancySelected }),
}));
jest.mock("next/router", () => ({ __esModule: true, default: { push: (route: string) => push(route) } }));
jest.mock("../../lib/telemetryClient", () => ({ trackUiEvent: (name: string) => trackUiEvent(name) }));

import { useSwitchTenancy } from "../UseSwitchTenancy";

test("switching records the event, selects the tenancy and opens the home", () => {
    const { result } = renderHook(() => useSwitchTenancy());

    result.current("datamap/production/data-amazon");

    expect(calls).toEqual(["track tenancy_switched", "select datamap/production/data-amazon", "push /app/home"]);
});
