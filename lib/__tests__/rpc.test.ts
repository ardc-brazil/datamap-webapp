import { buildHeaders, defaultTenancy } from "../rpc";

describe('Build header', () => {
    it('default header', () => {
        const actual = buildHeaders({
            uid: "uid",
            tenancies: ["test-tenancy", "t2"],
        })
        expect(actual).toEqual({
            headers: {
                "X-User-Id": "uid",
                "X-Datamap-Tenancies": "test-tenancy;t2",
            }
        })
    }),

    it('uid is empty', () => {
        const actual = buildHeaders({
            uid: undefined,
            tenancies: ["test-tenancy"],
        })
        expect(actual).toEqual({
            headers: {
                "X-User-Id": "",
                "X-Datamap-Tenancies": "test-tenancy",
            }
        })
    }),
    it('tenancy is empty', () => {
        const actual = buildHeaders({
            uid: "uid"
        })
        expect(actual).toEqual({
            headers: {
                "X-User-Id": "uid",
                "X-Datamap-Tenancies": defaultTenancy,
            }
        })
    })
})
