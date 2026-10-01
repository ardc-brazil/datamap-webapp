jest.mock("../../../../lib/share", () => ({ claimInvitations: jest.fn() }));

import { describe, expect, test } from '@jest/globals';
import { hydrateWithUserInfo } from "../[...nextauth]";

describe('Hydrate token with user info', () => {
    test('default', () => {
        const actual = hydrateWithUserInfo({}, {
            id: "uid",
            tenancies: ["tenancy", "t2"]
        })

        expect(actual).toEqual(
            {
                uid: "uid",
                tenancies: ["tenancy", "t2"],
            }
        )
    });

    test('tenancies is undefined', () => {
        const actual = hydrateWithUserInfo({}, {
            id: "uid"
        })

        expect(actual).toEqual(
            {
                uid: "uid"
            }
        )
    });

    test('tenancies is empty', () => {
        const actual = hydrateWithUserInfo({}, {
            id: "uid",
            tenancies: [],
        })

        expect(actual).toEqual(
            {
                uid: "uid"
            }
        )
    });

    test('drops tenancies the user no longer has', () => {
        // Access was revoked. Keeping the claim from the previous login would
        // let the session go on querying a tenancy the user was removed from.
        const actual = hydrateWithUserInfo({ uid: "uid", tenancies: ["gone"] }, {
            id: "uid",
            tenancies: [],
        })

        expect(actual).toEqual(
            {
                uid: "uid"
            }
        )
    });

    test('picks up a tenancy granted after login', () => {
        const actual = hydrateWithUserInfo({ uid: "uid" }, {
            id: "uid",
            tenancies: ["amazonface"],
        })

        expect(actual).toEqual(
            {
                uid: "uid",
                tenancies: ["amazonface"],
            }
        )
    });
})

import { claimPendingInvitations } from "../[...nextauth]";
import { claimInvitations } from "../../../../lib/share";

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
