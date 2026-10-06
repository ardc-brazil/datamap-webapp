import { describe, expect, test } from '@jest/globals';
import { isTenancyRevoked } from "../tenancyRevocation";

describe("a revoked tenancy", () => {
    test("is a 401 whose code starts with unauthorized_tenancy, whatever follows", () => {
        expect(isTenancyRevoked(401, "unauthorized_tenancy")).toBe(true);
        expect(isTenancyRevoked(401, "unauthorized_tenancy: user is not a member of datamap/production/data-amazon")).toBe(true);
    });

    test("cannot be told apart from the gatekeeper's 401 for a deleted account, which also leaves the tenancy", () => {
        expect(isTenancyRevoked(401, "unauthorized_tenancy '['datamap/production/data-amazon']' for user '7d1f0a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b'")).toBe(true);
    });

    test("is not any other 401", () => {
        expect(isTenancyRevoked(401, "user not authorized to perform the operation")).toBe(false);
        expect(isTenancyRevoked(401, undefined)).toBe(false);
    });

    test("is never another status", () => {
        expect(isTenancyRevoked(403, "unauthorized_tenancy")).toBe(false);
        expect(isTenancyRevoked(undefined, "unauthorized_tenancy")).toBe(false);
    });
});
