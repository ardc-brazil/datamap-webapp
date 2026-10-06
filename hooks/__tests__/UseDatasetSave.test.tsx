/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from "axios";
import { GENERIC_ERROR_MESSAGE } from "../../contants/EmbargoConstants";
import { tenancyErrorMessage } from "../../contants/TenancyConstants";

const updateDataset = jest.fn() as any;
jest.mock("../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ updateDataset })),
}));

import { useDatasetSave } from "../UseDatasetSave";

function dataset(): any {
    return { id: "d1", name: "Ozone", tenancy: "datamap/production/atto", is_enabled: true, data: { license: "cc-by", institution: "USP" } };
}

function gatekeeperRefusal(status: number, detail: string) {
    return new AxiosError("refused", "ERR_BAD_REQUEST", undefined, {}, {
        status, data: { detail }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
    } as any);
}

beforeEach(() => updateDataset.mockReset());

describe("useDatasetSave", () => {
    test("a saved change goes out with the dataset's own tenancy and is kept on the dataset", async () => {
        updateDataset.mockResolvedValue({});
        const data = dataset();
        const { result } = renderHook(() => useDatasetSave(data));

        let saved: boolean;
        await act(async () => { saved = await result.current.save({ data: { license: "cc0" } }); });

        expect(saved).toBe(true);
        expect(updateDataset).toHaveBeenCalledWith({
            id: "d1", name: "Ozone", tenancy: "datamap/production/atto", is_enabled: true,
            data: { license: "cc0", institution: "USP" },
        });
        expect(data.data.license).toBe("cc0");
        expect(result.current.error).toBeNull();
    });

    test("a dataset refused for changing tenancy says why and keeps the stored values", async () => {
        updateDataset.mockRejectedValue(gatekeeperRefusal(400, "tenancy_cannot_change"));
        const data = dataset();
        const { result } = renderHook(() => useDatasetSave(data));

        let saved: boolean;
        await act(async () => { saved = await result.current.save({ name: "Ozone 2", data: { license: "cc0" } }); });

        expect(saved).toBe(false);
        expect(result.current.error).toBe(tenancyErrorMessage("tenancy_cannot_change"));
        expect(data.name).toBe("Ozone");
        expect(data.data.license).toBe("cc-by");
    });

    test("a network failure gives the generic sentence", async () => {
        const offline = new AxiosError("Network Error", "ERR_NETWORK", undefined, {});
        updateDataset.mockRejectedValue(offline);
        const { result } = renderHook(() => useDatasetSave(dataset()));

        await act(async () => { await result.current.save({ data: {} }); });

        expect(result.current.error).toBe(GENERIC_ERROR_MESSAGE);
    });

    test("saving is true while the request is in flight, and a new attempt clears the last error", async () => {
        updateDataset.mockRejectedValueOnce(gatekeeperRefusal(403, "forbidden"));
        const { result } = renderHook(() => useDatasetSave(dataset()));
        await act(async () => { await result.current.save({ data: {} }); });
        expect(result.current.error).toBe("You are not allowed to do this on this dataset.");

        let answer: (value: unknown) => void;
        updateDataset.mockReturnValueOnce(new Promise(resolve => { answer = resolve; }));
        let pending: Promise<boolean>;
        act(() => { pending = result.current.save({ data: {} }); });

        expect(result.current.saving).toBe(true);
        expect(result.current.error).toBeNull();

        await act(async () => { answer({}); await pending; });
        expect(result.current.saving).toBe(false);
    });

    test("clearError forgets the message", async () => {
        updateDataset.mockRejectedValue(gatekeeperRefusal(404, "dataset_not_found"));
        const { result } = renderHook(() => useDatasetSave(dataset()));
        await act(async () => { await result.current.save({ data: {} }); });

        act(() => result.current.clearError());

        expect(result.current.error).toBeNull();
    });
});
