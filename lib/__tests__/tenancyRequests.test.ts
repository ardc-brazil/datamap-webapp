import { describe, expect, test } from '@jest/globals';
import { approvedTenancyMissingFromSession, latestRequestState } from "../tenancyRequests";

const NOW = new Date("2026-10-05T12:00:00+00:00");
const AMAZON = { path: "datamap/production/data-amazon", display_name: "Data Amazon", is_default: false, is_legacy: false };

function request(overrides: any = {}): any {
    return {
        id: "r1", requested_name: "Data Amazon", reason: "SMPS data", status: "pending", tenancy: null,
        created_tenancy: false, decision_message: null, created_at: "2026-09-28T12:00:00+00:00", decided_at: null,
        ...overrides,
    };
}

describe("the request outcome to show", () => {
    test("no requests, nothing to show", () => {
        expect(latestRequestState([], NOW)).toBeNull();
        expect(latestRequestState(undefined, NOW)).toBeNull();
    });

    test("a pending request is shown", () => {
        expect(latestRequestState([request()], NOW)?.kind).toBe("pending");
    });

    test("a decline from the last 30 days is shown", () => {
        const declined = request({ status: "declined", decided_at: "2026-09-10T12:00:00+00:00" });

        expect(latestRequestState([declined], NOW)).toEqual({ kind: "declined", request: declined });
    });

    test("an older decline is not", () => {
        expect(latestRequestState([request({ status: "declined", decided_at: "2026-08-20T12:00:00+00:00" })], NOW)).toBeNull();
    });

    test("only the newest request counts: a newer pending one hides an older decline", () => {
        const newer = request({ id: "r2" });
        const older = request({ status: "declined", decided_at: "2026-10-01T12:00:00+00:00" });

        expect(latestRequestState([newer, older], NOW)).toEqual({ kind: "pending", request: newer });
    });

    test("a withdrawn request shows nothing", () => {
        expect(latestRequestState([request({ status: "withdrawn" })], NOW)).toBeNull();
    });

    test("a recent approval is shown with its tenancy", () => {
        const approved = request({ status: "approved", tenancy: AMAZON, decided_at: "2026-10-04T12:00:00+00:00" });

        expect(latestRequestState([approved], NOW)).toEqual({ kind: "approved", request: approved });
    });

    test("an approval the session does not have yet is missing", () => {
        const state = latestRequestState([request({ status: "approved", tenancy: AMAZON, decided_at: "2026-10-04T12:00:00+00:00" })], NOW);

        expect(approvedTenancyMissingFromSession(state, ["datamap/production/public"])).toBe(true);
    });

    test("an approval already in the session is not", () => {
        const state = latestRequestState([request({ status: "approved", tenancy: AMAZON, decided_at: "2026-10-04T12:00:00+00:00" })], NOW);

        expect(approvedTenancyMissingFromSession(state, ["datamap/production/public", AMAZON.path])).toBe(false);
    });

    test("a pending request is never missing from the session", () => {
        expect(approvedTenancyMissingFromSession(latestRequestState([request()], NOW), [])).toBe(false);
    });
});
