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

describe("AccessPending", () => {

    beforeEach(() => {
        update.mockReset();
        reload.mockReset();
    });

    test("tells the person their access is not set up yet", () => {
        render(<AccessPending />);

        expect(screen.getByTestId("access-pending")).toBeTruthy();
    });

    test("re-reads the session instead of making the person sign out and in", async () => {
        update.mockResolvedValue({ user: { tenancies: [] } });

        fireEvent.click(render(<AccessPending />).getByRole("button"));

        await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    });

    test("reloads once the access has actually been granted", async () => {
        update.mockResolvedValue({ user: { tenancies: ["amazonface"] } });

        fireEvent.click(render(<AccessPending />).getByRole("button"));

        await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    });

    test("does not reload while there is still no access", async () => {
        update.mockResolvedValue({ user: { tenancies: [] } });

        fireEvent.click(render(<AccessPending />).getByRole("button"));

        await waitFor(() => expect(update).toHaveBeenCalled());
        expect(reload).not.toHaveBeenCalled();
    });
});
