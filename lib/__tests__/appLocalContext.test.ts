/**
 * @jest-environment node
 */

import { describe, expect, test } from '@jest/globals';
import { defaultTenancy } from "../rpc";
import { NewContext } from "../appLocalContext";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

jest.mock("next-auth/jwt")
const mGetToken = jest.mocked(getToken)


describe('Create a new application context', () => {

    test('Token uid is empty', async () => {

        const context = await NewContext(new NextRequest(new URL('http://localhost:3000')))
        expect(context).toEqual({
            uid: undefined,
            tenancies: [defaultTenancy]
        })
    })

    test('Token tenancy is empty', async () => {

        mGetToken.mockResolvedValue({
            uid: "andré"
        })

        const context = await NewContext(new NextRequest(new URL('http://localhost:3000')))
        expect(context).toEqual({
            uid: "andré",
            tenancies: [defaultTenancy]
        })
    })

    test('Token tenancy is not empty', async () => {

        mGetToken.mockResolvedValue({
            uid: "andré",
            tenancies: ["myTenancy"]
        })

        const context = await NewContext(new NextRequest(new URL('http://localhost:3000')))
        expect(context).toEqual({
            uid: "andré",
            tenancies: ["myTenancy"]
        })
    })
})
