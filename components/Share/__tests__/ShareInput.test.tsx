/** @jest-environment jsdom */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const searchShareCandidates = jest.fn() as any;
jest.mock("../../../gateways/BFFAPI", () => ({
    BFFAPI: jest.fn().mockImplementation(() => ({ searchShareCandidates })),
}));

import { ShareInput } from "../ShareInput";

beforeEach(() => {
    jest.useFakeTimers();
    searchShareCandidates.mockResolvedValue([{ id: "u2", name: "Marcia Yamasoe", email: "marcia.yamasoe@iag.usp.br" }]);
});

function type(text: string) {
    fireEvent.change(screen.getByLabelText("Add people by name, email or ORCID"), { target: { value: text } });
}

async function settle() {
    await act(async () => { jest.advanceTimersByTime(300); });
    await act(async () => { await Promise.resolve(); });
}

describe("ShareInput", () => {
    test("searches the workspace once the typing settles, and says how to reach others", async () => {
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={jest.fn() as any} />);

        type("ma");
        type("mar");
        expect(searchShareCandidates).not.toHaveBeenCalled();
        await settle();

        await waitFor(() => expect(searchShareCandidates).toHaveBeenCalledTimes(1));
        expect(searchShareCandidates).toHaveBeenCalledWith("d1", "mar");
        expect(await screen.findByRole("button", { name: /Marcia Yamasoe/ })).toBeTruthy();
        expect(screen.getByText("Someone outside Data Amazon? Type their full email or ORCID.")).toBeTruthy();
    });

    test("picking a suggestion grants to that user at the chosen level", async () => {
        const onGrant = (jest.fn() as any).mockResolvedValue(undefined);
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={onGrant} />);

        fireEvent.change(screen.getByLabelText("Access level"), { target: { value: "write" } });
        type("mar");
        await settle();
        fireEvent.click(await screen.findByRole("button", { name: /Marcia Yamasoe/ }));

        await waitFor(() => expect(onGrant).toHaveBeenCalledWith({ user_id: "u2", level: "write" }));
    });

    test("a full email is offered as an invitation, without searching", async () => {
        const onGrant = (jest.fn() as any).mockResolvedValue(undefined);
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={onGrant} />);

        type("joao.silva@inpe.br");
        await settle();
        fireEvent.click(screen.getByRole("button", { name: /Invite joao.silva@inpe.br/ }));

        await waitFor(() => expect(onGrant).toHaveBeenCalledWith({ email: "joao.silva@inpe.br", level: "read" }));
        expect(searchShareCandidates).not.toHaveBeenCalled();
    });

    test("an ORCID URL is offered as an invitation by ORCID", async () => {
        const onGrant = (jest.fn() as any).mockResolvedValue(undefined);
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={onGrant} />);

        type("https://orcid.org/0000-0002-1825-0097");
        fireEvent.click(screen.getByRole("button", { name: /Invite ORCID 0000-0002-1825-0097/ }));

        await waitFor(() => expect(onGrant).toHaveBeenCalledWith({ orcid: "0000-0002-1825-0097", level: "read" }));
    });

    test("a mistyped ORCID is refused on the spot, in the design's words", () => {
        render(<ShareInput datasetId="d1" tenancyName="Data Amazon" onGrant={jest.fn() as any} />);

        type("0000-0002-1825-0098");

        expect(screen.getByText("0000-0002-1825-0098 isn't a valid ORCID")).toBeTruthy();
        expect(screen.getByText("The last digit doesn't check out. Compare it with the person's ORCID page.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Invite/ })).toBeNull();
    });
});
