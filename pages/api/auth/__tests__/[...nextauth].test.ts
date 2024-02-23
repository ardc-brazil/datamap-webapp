import { hydrateWithUserInfo } from "../[...nextauth]";
import { defaultTenancy } from "../../../../lib/rpc";

describe('Hydrate token with user info', () => {
    it('default', () => {
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

    it('tenancies is undefined', () => {
        const actual = hydrateWithUserInfo({}, {
            id: "uid"
        })

        expect(actual).toEqual(
            {
                uid: "uid",
                tenancies: [defaultTenancy],
            }
        )
    });

    it('tenancies is empty', () => {
        const actual = hydrateWithUserInfo({}, {
            id: "uid",
            tenancies: [],
        })

        expect(actual).toEqual(
            {
                uid: "uid",
                tenancies: [defaultTenancy],
            }
        )
    });
})
