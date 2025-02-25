import { describe, expect, test } from '@jest/globals';
import { buildHeaders } from "../rpc";

describe('Build header', () => {
    test('default header', () => {
        const actual = buildHeaders({
            uid: "uid",
            tenancy: "datamap/testing/unit-test-local"
        })
        expect(actual).toEqual({
            headers: {
                "X-User-Id": "uid",
                "X-Datamap-Tenancies": "datamap/testing/unit-test-local",
            }
        })
    })

    test('uid is empty', () => {
        const actual = buildHeaders({
            uid: undefined,
            tenancy: ""
        })
        expect(actual).toEqual({
            headers: {
                "X-User-Id": "",
                "X-Datamap-Tenancies": "",
            }
        })
    })
})
