/**
 * @jest-environment jsdom
 */
import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const update = jest.fn() as any;
const reload = jest.fn();

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: null, status: "authenticated", update }),
}));

jest.mock("next/router", () => ({
    __esModule: true,
    default: { reload: () => reload() },
}));

import { AccessPending } from "../AccessPending";

function checkAgain() {
    fireEvent.click(screen.getByRole("button", { name: "I already have access — check again" }));
}

describe("AccessPending", () => {

    beforeEach(() => {
        update.mockReset();
        reload.mockReset();
    });

    test("tells the person they are not in any tenancy", () => {
        render(<AccessPending onRequestAccess={jest.fn()} />);

        expect(screen.getByTestId("access-pending")).toBeTruthy();
        expect(screen.getByText("You're not in any tenancy")).toBeTruthy();
        expect(screen.getByText("Your account is not part of any tenancy, so there is nothing to work in yet. Ask for access to the group or project you work with; an administrator reviews it and you're emailed with the answer.")).toBeTruthy();
    });

    test("Request access opens the request form", () => {
        const onRequestAccess = jest.fn();
        render(<AccessPending onRequestAccess={onRequestAccess} />);

        fireEvent.click(screen.getByRole("button", { name: "Request access" }));

        expect(onRequestAccess).toHaveBeenCalledTimes(1);
    });

    test("re-reads the session instead of making the person sign out and in", async () => {
        update.mockResolvedValue({ user: { tenancies: [] } });
        render(<AccessPending onRequestAccess={jest.fn()} />);

        checkAgain();

        await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    });

    test("reloads once the access has actually been granted", async () => {
        update.mockResolvedValue({ user: { tenancies: ["datamap/production/public"] } });
        render(<AccessPending onRequestAccess={jest.fn()} />);

        checkAgain();

        await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    });

    test("does not reload while there is still no access", async () => {
        update.mockResolvedValue({ user: { tenancies: [] } });
        render(<AccessPending onRequestAccess={jest.fn()} />);

        checkAgain();

        await waitFor(() => expect(update).toHaveBeenCalled());
        expect(reload).not.toHaveBeenCalled();
    });

    test("points to the datasets shared with the user", () => {
        render(<AccessPending onRequestAccess={jest.fn()} />);

        expect(screen.getByRole("link", { name: "Shared with me" }).getAttribute("href")).toBe("/app/datasets/shared");
    });
});
