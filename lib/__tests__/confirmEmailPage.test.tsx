/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";

jest.mock("next/head", () => ({
    __esModule: true,
    default: ({ children }: { children: unknown }) => children,
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: null, status: "authenticated" }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ query: {} }) }));
jest.mock("../../components/Account/ConfirmEmailForm", () => ({ ConfirmEmailForm: () => null }));
jest.mock("../../components/Public/BareLayout", () => ({
    BareLayout: ({ children }: { children: unknown }) => children,
}));

import ConfirmEmailPage from "../../pages/account/confirm-email";

test("the confirmation page has its own title", () => {
    const { container } = render(<ConfirmEmailPage />);

    expect(container.querySelector("title")?.textContent).toBe("Confirm your email · DataMap");
});
