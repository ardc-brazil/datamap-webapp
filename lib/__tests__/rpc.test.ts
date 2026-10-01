import { describe, expect, test } from '@jest/globals';
import { AxiosError, AxiosHeaders } from "axios";
import { buildHeaders, httpErrorHandler } from "../rpc";

function axiosErrorWith(status: number, data: unknown) {
    return new AxiosError("request failed", "ERR_BAD_REQUEST", undefined, {}, {
        status,
        data,
        statusText: "",
        headers: {},
        config: { headers: new AxiosHeaders() },
    } as any);
}

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

describe('httpErrorHandler', () => {
    test('a 403 is forbidden, not an internal error', () => {
        const e = httpErrorHandler(axiosErrorWith(403, { detail: "forbidden" }));
        expect(e.httpCode).toBe(403);
        expect(e.name).toBe("FORBIDDEN");
    })

    test('a 409 keeps the gatekeeper detail', () => {
        const e = httpErrorHandler(axiosErrorWith(409, { detail: "invitation_already_accepted" }));
        expect(e.httpCode).toBe(409);
        expect(e.name).toBe("CONFLICT");
        expect(e.message).toBe("invitation_already_accepted");
    })

    test('a 400 keeps the error codes', () => {
        const e = httpErrorHandler(axiosErrorWith(400, {
            details: "Invalid client input",
            errors: [{ code: "embargo_too_long", field: null }],
        }));
        expect(e.httpCode).toBe(400);
        expect(e.errors).toEqual([{ code: "embargo_too_long", field: null }]);
    })
})
