jest.mock("../share", () => ({ claimInvitations: jest.fn() }));
jest.mock("../tenancies", () => ({ listMyTenancies: jest.fn() }));
jest.mock("../users", () => ({ ...(jest.requireActual("../users") as object), getUserByUID: jest.fn() }));
jest.mock("../logging", () => ({ ...(jest.requireActual("../logging") as object), logError: jest.fn() }));

import { beforeEach, describe, expect, test } from '@jest/globals';
import { authOptions, hydratePasswordSignIn, hydrateWithUserInfo, TOKEN_VERSION } from "../../pages/api/auth/[...nextauth]";
import { logError } from "../logging";
import { listMyTenancies } from "../tenancies";
import { getUserByUID } from "../users";

const summary = (path: string) => ({ path, display_name: path, is_default: false, is_legacy: false });

function enabled(...paths: string[]) {
    jest.mocked(listMyTenancies).mockResolvedValue(paths.map(summary));
}

beforeEach(() => {
    jest.mocked(listMyTenancies).mockReset();
    jest.mocked(logError).mockReset();
});

describe('Hydrate token with user info', () => {
    test('the tenancies are the enabled ones, not every one on the user record', async () => {
        enabled("tenancy");

        const actual = await hydrateWithUserInfo({}, { id: "uid", tenancies: ["tenancy", "disabled"] });

        expect(listMyTenancies).toHaveBeenCalledWith("uid");
        expect(actual).toEqual({ uid: "uid", tenancies: ["tenancy"] });
    });

    test('no enabled tenancy is no claim', async () => {
        enabled();

        expect(await hydrateWithUserInfo({}, { id: "uid", tenancies: ["disabled"] })).toEqual({ uid: "uid" });
    });

    test('drops tenancies the user no longer has', async () => {
        enabled();

        expect(await hydrateWithUserInfo({ uid: "uid", tenancies: ["gone"] }, { id: "uid", tenancies: [] })).toEqual({ uid: "uid" });
    });

    test('picks up a tenancy granted after login', async () => {
        enabled("amazonface");

        expect(await hydrateWithUserInfo({ uid: "uid" }, { id: "uid" })).toEqual({ uid: "uid", tenancies: ["amazonface"] });
    });

    test('a failed read falls back to the user record, so the sign-in still completes', async () => {
        jest.mocked(listMyTenancies).mockRejectedValue(new Error("gatekeeper down"));

        const actual = await hydrateWithUserInfo({}, { id: "uid", tenancies: ["tenancy", "t2"] });

        expect(actual).toEqual({ uid: "uid", tenancies: ["tenancy", "t2"] });
        expect(logError).toHaveBeenCalled();
    });

    test('a failed read with nothing on the user record is no claim', async () => {
        jest.mocked(listMyTenancies).mockRejectedValue(new Error("gatekeeper down"));

        expect(await hydrateWithUserInfo({}, { id: "uid" })).toEqual({ uid: "uid" });
    });
});

describe('the session carries only enabled tenancies', () => {
    test('a password sign-in', async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", name: "Ana", email: "ana@usp.br", tenancies: ["datamap/production/atto", "datamap/production/off"] } as any);
        enabled("datamap/production/atto");

        const token = await hydratePasswordSignIn({}, "u1");

        expect(token.tenancies).toEqual(["datamap/production/atto"]);
    });

    test('update()', async () => {
        jest.mocked(getUserByUID).mockResolvedValue({ id: "u1", tenancies: ["datamap/production/atto", "datamap/production/off"] } as any);
        enabled("datamap/production/atto");

        const token = await authOptions.callbacks.jwt({ token: { uid: "u1", v: TOKEN_VERSION, tenancies: ["datamap/production/off"] }, trigger: "update" } as any);

        expect(token.tenancies).toEqual(["datamap/production/atto"]);
    });
});

import { claimPendingInvitations } from "../../pages/api/auth/[...nextauth]";
import { claimInvitations } from "../share";

describe('claiming pending invitations at sign-in', () => {
    test('claims for the user who signed in', async () => {
        jest.mocked(claimInvitations).mockResolvedValue({ accepted: [] });

        await claimPendingInvitations("u1");

        expect(claimInvitations).toHaveBeenCalledWith("u1");
    });

    test('a failure never blocks the sign-in', async () => {
        jest.mocked(claimInvitations).mockRejectedValue(new Error("gatekeeper down"));
        const original = process.stdout.write;
        // @ts-ignore
        process.stdout.write = () => true;
        try {
            await expect(claimPendingInvitations("u1")).resolves.toBeUndefined();
        } finally {
            process.stdout.write = original;
        }
    });
});
