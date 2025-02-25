/**
 * @jest-environment node
 */

import { describe, expect, test } from '@jest/globals';
import { NewContext } from "../appLocalContext";
import { NextRequest } from "next/server";
import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { TENANCY_STORAGE_NAME } from "../../types/TenancyStore";

jest.mock("next-auth/jwt")
const mGetToken = jest.mocked(getToken)

// TODO: Review AppContext unit tests
const defaultTestTenancy = "datamap/testing/unit-test-local";
const testTenancyToken = JSON.stringify({ "state": { "tenancySelected": defaultTestTenancy, "root": "datamap", "environment": "testing", "namespace": "playwright-local" }, "version": 0 })

describe('Create a new application context', () => {

    test('Token uid is empty in NextRequest', async () => {
        const request = new NextRequest(new URL('http://localhost:3000'));
        request.cookies.set(TENANCY_STORAGE_NAME, testTenancyToken)

        const context = await NewContext(request)
        expect(context).toEqual({
            uid: undefined,
            tenancy: defaultTestTenancy,
        })
    })

    test('Token uid is empty in NextAPIRequest', async () => {
        const partialRequest: Partial<NextApiRequest> = {
            url: "/api/clients",
            cookies: {
                [TENANCY_STORAGE_NAME]: testTenancyToken,
            },
        };

        const context = await NewContext(partialRequest as NextApiRequest)
        expect(context).toEqual({
            uid: undefined,
            tenancy: defaultTestTenancy,
        })
    })

    test('Token tenancy is empty in NextRequest', async () => {

        mGetToken.mockResolvedValue({
            uid: "andré"
        })

        const context = await NewContext(new NextRequest(new URL('http://localhost:3000')))
        expect(context).toEqual({
            uid: "andré",
            tenancy: undefined
        })
    })
    
})
