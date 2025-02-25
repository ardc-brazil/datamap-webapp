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
})
