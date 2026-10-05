/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";

const mockSignIn = jest.fn();
const mockStartOrcidConnection = jest.fn();

jest.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
}));

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ startOrcidConnection: mockStartOrcidConnection })),
}));

import { ORCID_CONNECT_UID_STORAGE_KEY } from "../../../contants/AccountConstants";
import { ConnectOrcid } from "../ConnectOrcid";

const UID = "b0000000-0000-0000-0000-00000000000b";

afterEach(() => {
    window.sessionStorage.clear();
});

async function clickConnect() {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Connect ORCID" }));
    });
}

describe("ConnectOrcid", () => {
    test("records the intent to link before starting an ORCID sign-in that comes back to the profile", async () => {
        const order: string[] = [];
        mockStartOrcidConnection.mockImplementation(async () => {
            order.push("intent");
        });
        mockSignIn.mockImplementation(async () => {
            order.push(`signIn as ${window.sessionStorage.getItem(ORCID_CONNECT_UID_STORAGE_KEY)}`);
        });
        render(<ul><ConnectOrcid accountEmail="ada@usp.br" accountUid={UID} /></ul>);

        await clickConnect();

        expect(order).toEqual(["intent", `signIn as ${UID}`]);
        expect(mockSignIn).toHaveBeenCalledWith("orcid", { callbackUrl: "/app/profile" });
    });

    test("does not go to ORCID when the intent could not be recorded, and says so", async () => {
        mockStartOrcidConnection.mockRejectedValue({ response: { status: 401 } });
        render(<ul><ConnectOrcid accountEmail="ada@usp.br" accountUid={UID} /></ul>);

        await clickConnect();

        expect(mockSignIn).not.toHaveBeenCalled();
        expect(window.sessionStorage.getItem(ORCID_CONNECT_UID_STORAGE_KEY)).toBeNull();
        expect(screen.getByRole("alert").textContent).toBe("ORCID could not be connected. Try again.");
    });

    test("storage that throws does not stop the connection", async () => {
        mockStartOrcidConnection.mockResolvedValue(undefined);
        const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        render(<ul><ConnectOrcid accountEmail="ada@usp.br" accountUid={UID} /></ul>);

        await clickConnect();

        expect(mockSignIn).toHaveBeenCalledWith("orcid", { callbackUrl: "/app/profile" });
        setItem.mockRestore();
    });

    test("says which email to confirm so the iD lands on this account", () => {
        render(<ul><ConnectOrcid accountEmail="ada@usp.br" accountUid={UID} /></ul>);

        expect(screen.getByTestId("connect-orcid").textContent).toContain("ada@usp.br");
    });
});
