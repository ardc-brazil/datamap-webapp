/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from "axios";
import { tenancyErrorMessage } from "../../../contants/TenancyConstants";

const updateDataset = jest.fn() as any;
jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ updateDataset })),
}));
jest.mock("../../../lib/users", () => ({ canEditDataset: () => true }));

import DatasetColaboratorsForm, { CONTRIBUTORS_ACCESS_NOTE } from "../DatasetColaboratorsForm";

function dataset(colaborators: any[]): any {
    return { id: "d1", name: "Ozone", tenancy: "t", is_enabled: true, data: { colaborators } };
}

describe("DatasetColaboratorsForm", () => {
    beforeEach(() => updateDataset.mockResolvedValue({}));

    test("lists contributors by name only, whatever permission the JSON still holds", () => {
        render(<DatasetColaboratorsForm dataset={dataset([{ name: "Ana", permission: "can_edit" }])} user={{} as any} />);

        expect(screen.getByText("Ana")).toBeTruthy();
        expect(screen.queryByText(/Editor|Viewer|Owner/)).toBeNull();
    });

    test("the form asks for a name, not a permission, and points to Share for access", () => {
        render(<DatasetColaboratorsForm dataset={dataset([{ name: "Ana" }])} user={{} as any} alwaysEdition />);

        expect(screen.getByLabelText("Name")).toBeTruthy();
        expect(screen.queryByLabelText("Permission")).toBeNull();
        expect(screen.getByText(CONTRIBUTORS_ACCESS_NOTE)).toBeTruthy();
    });

    test("a contributor with only a name is saved, and stored permissions are kept", async () => {
        const data = dataset([{ name: "Ana", permission: "owner" }]);
        render(<DatasetColaboratorsForm dataset={data} user={{} as any} alwaysEdition />);

        fireEvent.click(screen.getByText("+ Add collaborator"));
        fireEvent.change(screen.getAllByLabelText("Name")[1], { target: { value: "Bruno" } });
        fireEvent.submit(screen.getAllByLabelText("Name")[1].closest("form") as HTMLFormElement);

        await waitFor(() => expect(updateDataset).toHaveBeenCalledTimes(1));
        expect(updateDataset.mock.calls[0][0].data.colaborators).toEqual([
            { name: "Ana", permission: "owner" },
            { name: "Bruno" },
        ]);
    });

    test("an edit keeps the dataset in the tenancy it was created in", async () => {
        updateDataset.mockClear();
        render(<DatasetColaboratorsForm dataset={dataset([{ name: "Ana" }])} user={{} as any} alwaysEdition />);

        fireEvent.submit(screen.getAllByLabelText("Name")[0].closest("form") as HTMLFormElement);

        await waitFor(() => expect(updateDataset).toHaveBeenCalledTimes(1));
        expect(updateDataset.mock.calls[0][0].tenancy).toBe("t");
    });

    test("a saved edit closes the form and shows the new list", async () => {
        render(<DatasetColaboratorsForm dataset={dataset([{ name: "Ana" }])} user={{} as any} />);

        fireEvent.click(screen.getByText("Edit"));
        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Bruno" } });
        fireEvent.submit(screen.getByLabelText("Name").closest("form") as HTMLFormElement);

        await waitFor(() => expect(screen.queryByLabelText("Name")).toBeNull());
        expect(screen.getByText("Bruno")).toBeTruthy();
    });

    test("a refused edit says why and keeps the form open with what was typed", async () => {
        updateDataset.mockRejectedValue(new AxiosError("refused", "ERR_BAD_REQUEST", undefined, {}, {
            status: 400, data: { detail: "tenancy_cannot_change" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() },
        } as any));
        const data = dataset([{ name: "Ana" }]);
        render(<DatasetColaboratorsForm dataset={data} user={{} as any} />);

        fireEvent.click(screen.getByText("Edit"));
        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Bruno" } });
        fireEvent.submit(screen.getByLabelText("Name").closest("form") as HTMLFormElement);

        expect((await screen.findByRole("alert")).textContent).toBe(tenancyErrorMessage("tenancy_cannot_change"));
        expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Bruno");
        expect(data.data.colaborators).toEqual([{ name: "Ana" }]);
    });
});
