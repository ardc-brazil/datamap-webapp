/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ORCID_CONNECT_UID_STORAGE_KEY } from "../../../contants/AccountConstants";
import { OrcidAccountSwitchNotice } from "../OrcidAccountSwitchNotice";

const ACCOUNT_A = "a0000000-0000-0000-0000-00000000000a";
const ACCOUNT_B = "b0000000-0000-0000-0000-00000000000b";

afterEach(() => {
    window.sessionStorage.clear();
    jest.restoreAllMocks();
});

describe("OrcidAccountSwitchNotice", () => {
    test("coming back signed in to another account than the one that connected ORCID says so, once", () => {
        window.sessionStorage.setItem(ORCID_CONNECT_UID_STORAGE_KEY, ACCOUNT_B);

        const { unmount } = render(<OrcidAccountSwitchNotice currentUid={ACCOUNT_A} />);

        expect(screen.getByRole("alert").textContent).toBe("You are now signed in to a different DataMap account — the one that already uses this ORCID iD.");
        expect(window.sessionStorage.getItem(ORCID_CONNECT_UID_STORAGE_KEY)).toBeNull();
        unmount();

        const { container } = render(<OrcidAccountSwitchNotice currentUid={ACCOUNT_A} />);
        expect(container.innerHTML).toBe("");
    });

    test("coming back to the same account shows nothing and forgets the stored id", () => {
        window.sessionStorage.setItem(ORCID_CONNECT_UID_STORAGE_KEY, ACCOUNT_B);

        const { container } = render(<OrcidAccountSwitchNotice currentUid={ACCOUNT_B} />);

        expect(container.innerHTML).toBe("");
        expect(window.sessionStorage.getItem(ORCID_CONNECT_UID_STORAGE_KEY)).toBeNull();
    });

    test("nothing stored shows nothing", () => {
        const { container } = render(<OrcidAccountSwitchNotice currentUid={ACCOUNT_A} />);

        expect(container.innerHTML).toBe("");
    });

    test("a session without a user id yet leaves the stored id for later", () => {
        window.sessionStorage.setItem(ORCID_CONNECT_UID_STORAGE_KEY, ACCOUNT_B);

        const { container } = render(<OrcidAccountSwitchNotice currentUid={undefined} />);

        expect(container.innerHTML).toBe("");
        expect(window.sessionStorage.getItem(ORCID_CONNECT_UID_STORAGE_KEY)).toBe(ACCOUNT_B);
    });

    test("storage that throws shows nothing instead of breaking the profile", () => {
        jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });

        const { container } = render(<OrcidAccountSwitchNotice currentUid={ACCOUNT_A} />);

        expect(container.innerHTML).toBe("");
    });
});
