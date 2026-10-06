/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormikContext } from "formik";
import { useEffect } from "react";

const createNewDataset = jest.fn() as any;
const createUploadFileAuthToken = jest.fn() as any;
const setMembersAccess = jest.fn() as any;
const setEmbargo = jest.fn() as any;
const updateDataset = jest.fn() as any;
const publishDatasetVersion = jest.fn() as any;

jest.mock("../../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({
        createNewDataset, createUploadFileAuthToken, setMembersAccess, setEmbargo, updateDataset, publishDatasetVersion,
    })),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { name: "Luciana Rizzo", uid: "u1" } } }) }));
jest.mock("typescript-cookie", () => ({ getCookie: jest.fn(), setCookie: jest.fn(), removeCookie: jest.fn() }), { virtual: true });
jest.mock("next/router", () => ({ __esModule: true, default: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock("../../../../components/LoggedLayout", () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock("../../../../components/base/UppyUploader", () => ({
    __esModule: true,
    default: function MockUppyUploader(props: any) {
        const formik = useFormikContext<any>();
        useEffect(() => {
            formik.setFieldValue("uploadedDataFiles", [{ id: "f1", name: "a.csv", extension: "csv" }]);
            const upload = jest.fn() as any;
            upload.mockResolvedValue(undefined);
            props.onUppyStateCreated({ upload });
            // Mirrors the real UppyUploader: bubble the uppy instance up once, after mount.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        return null;
    },
}));

import { useTenancyStore } from "../../../../components/TenancyStore";
import NewPage from "../new";

const createdDataset = {
    id: "d1",
    tenancy: "datamap/production/data-amazon",
    data: {},
    current_version: { name: "v1" },
};

beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-01T10:00:00Z"), doNotFake: ["setTimeout", "setInterval", "queueMicrotask", "nextTick"] });
    createNewDataset.mockReset().mockResolvedValue(createdDataset);
    createUploadFileAuthToken.mockReset().mockResolvedValue({ user: { id: "u1" }, token: { jwt: "jwt" } });
    setMembersAccess.mockReset().mockResolvedValue({ members_can_edit: false });
    setEmbargo.mockReset().mockResolvedValue({ active: true });
    updateDataset.mockReset().mockResolvedValue({});
    publishDatasetVersion.mockReset().mockResolvedValue({});
    useTenancyStore.setState({ tenancySelected: "datamap/production/data-amazon", root: "datamap", environment: "production", namespace: "data-amazon" });
});

describe("new dataset page: members access in Public", () => {
    test("switching to Public before saving shows the Public copy and never sends can-edit", async () => {
        render(<NewPage />);

        await waitFor(() => expect((screen.getByRole("button", { name: "Create dataset" }) as HTMLButtonElement).disabled).toBe(false));

        fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Amazon rain gauges" } });

        await act(async () => {
            fireEvent.click(screen.getByRole("radio", { name: /Under embargo/ }));
        });
        fireEvent.change(screen.getByLabelText("Embargo ends"), { target: { value: "2026-11-15" } });

        fireEvent.click(screen.getByRole("button", { name: "Change what members of Data Amazon can do" }));
        await act(async () => {
            fireEvent.click(screen.getByRole("radio", { name: /Read and edit/ }));
            fireEvent.click(screen.getByRole("button", { name: "Save" }));
        });
        expect(screen.getByText("When the embargo ends, members of Data Amazon can read and edit again.")).toBeTruthy();

        await act(async () => {
            useTenancyStore.setState({ tenancySelected: "datamap/production/public", root: "datamap", environment: "production", namespace: "public" });
        });

        expect(screen.getByText("When the embargo ends, members of Public can read but not edit.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Change what members/ })).toBeNull();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Create dataset" }));
        });

        await waitFor(() => expect(setEmbargo).toHaveBeenCalled());
        expect(setMembersAccess).not.toHaveBeenCalled();
    });
});
