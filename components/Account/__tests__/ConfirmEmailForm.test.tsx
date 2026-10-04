/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUpdate = jest.fn();
const mockSignOut = jest.fn();
const mockReplace = jest.fn();
const mockBff = {
    requestEmailVerification: jest.fn(),
    confirmEmailVerification: jest.fn(),
    resendChallenge: jest.fn(),
};
let mockCodeFormProps: any = null;

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: null, status: "authenticated", update: mockUpdate }),
    signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("next/router", () => ({
    __esModule: true,
    default: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: function BFFAPI() {
        return mockBff;
    },
}));

jest.mock("../VerificationCodeForm", () => ({
    VerificationCodeForm: (props: any) => {
        mockCodeFormProps = props;
        return require("react").createElement("div", { "data-testid": "code-step" }, props.email);
    },
}));

import { accountErrorMessage } from "../../../contants/AccountConstants";
import { ConfirmEmailForm } from "../ConfirmEmailForm";

const CONFLICT_MESSAGE = "This email belongs to another DataMap account. Contact the DataMap team.";

async function sendCode(email: string) {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    await screen.findByTestId("code-step");
}

beforeEach(() => {
    mockCodeFormProps = null;
    mockUpdate.mockResolvedValue({ user: { uid: "u1", pending: false } });
    mockReplace.mockResolvedValue(true);
    mockBff.requestEmailVerification.mockResolvedValue({ challengeId: "c1" });
});

describe("ConfirmEmailForm", () => {
    test("pre-fills the email with the hint", () => {
        render(<ConfirmEmailForm emailHint="ada@usp.br" callbackUrl="/app/home" />);

        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ada@usp.br");
    });

    test("starts empty without a hint", () => {
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("");
    });

    test("does not send a code to something that is not an email", async () => {
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
        fireEvent.click(screen.getByRole("button", { name: "Send code" }));

        expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
        expect(mockBff.requestEmailVerification).not.toHaveBeenCalled();
    });

    test("sends a code to the typed email and asks for it", async () => {
        render(<ConfirmEmailForm emailHint="ada@usp.br" callbackUrl="/app/home" />);

        await sendCode("ada.lovelace@usp.br");

        expect(mockBff.requestEmailVerification).toHaveBeenCalledWith("ada.lovelace@usp.br");
        expect(mockCodeFormProps.email).toBe("ada.lovelace@usp.br");
    });

    test("a confirmed code refreshes the session, then goes where the person was going", async () => {
        mockBff.confirmEmailVerification.mockResolvedValue(undefined);
        render(<ConfirmEmailForm emailHint="ada@usp.br" callbackUrl="/app/datasets/d1" />);
        await sendCode("ada@usp.br");

        await act(async () => {
            await mockCodeFormProps.onSubmit("123456");
        });

        expect(mockBff.confirmEmailVerification).toHaveBeenCalledWith("c1", "123456");
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockReplace).toHaveBeenCalledWith("/app/datasets/d1");
        expect(mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(mockReplace.mock.invocationCallOrder[0]);
    });

    test("an email of another account is explained and the person can try another one", async () => {
        mockBff.confirmEmailVerification.mockRejectedValue({ response: { status: 409, data: { detail: "email_belongs_to_another_account" } } });
        render(<ConfirmEmailForm emailHint="ada@usp.br" callbackUrl="/app/home" />);
        await sendCode("ada@usp.br");

        await act(async () => {
            await mockCodeFormProps.onSubmit("123456");
        });

        expect(screen.getByRole("alert").textContent).toBe(CONFLICT_MESSAGE);
        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ada@usp.br");
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
    });

    test("any other code error is left to the code form to show", async () => {
        const invalid = { response: { status: 400, data: { detail: "code_invalid" } } };
        mockBff.confirmEmailVerification.mockRejectedValue(invalid);
        render(<ConfirmEmailForm callbackUrl="/app/home" />);
        await sendCode("ada@usp.br");

        await expect(mockCodeFormProps.onSubmit("000000")).rejects.toBe(invalid);
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("resending uses the same challenge", async () => {
        mockBff.resendChallenge.mockResolvedValue(undefined);
        render(<ConfirmEmailForm callbackUrl="/app/home" />);
        await sendCode("ada@usp.br");

        await act(async () => {
            await mockCodeFormProps.onResend();
        });

        expect(mockBff.resendChallenge).toHaveBeenCalledWith("c1");
    });

    test("a different email can be used from the code step", async () => {
        render(<ConfirmEmailForm callbackUrl="/app/home" />);
        await sendCode("ada@usp.br");

        fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));

        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ada@usp.br");
    });

    test("an email the gatekeeper refuses is explained", async () => {
        mockBff.requestEmailVerification.mockRejectedValue({ response: { status: 400, data: { detail: "invalid_email" } } });
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@usp.br" } });
        fireEvent.click(screen.getByRole("button", { name: "Send code" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This email address is not valid."));
        expect(screen.queryByTestId("code-step")).toBeNull();
    });

    test("a failure to send the code is shown", async () => {
        mockBff.requestEmailVerification.mockRejectedValue({ response: { status: 503, data: {} } });
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@usp.br" } });
        fireEvent.click(screen.getByRole("button", { name: "Send code" }));

        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(accountErrorMessage(undefined)));
    });

    test("the person can sign out instead", () => {
        render(<ConfirmEmailForm callbackUrl="/app/home" />);

        fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
    });
});
