import { describe, expect, test } from '@jest/globals';
import { APIError } from "../../types/APIError";
import { messageForApiError } from "../EmbargoConstants";
import {
    DEFAULT_TENANCY,
    LEGACY_PREFIX,
    NAMESPACE_PATTERN,
    PRODUCTION_PREFIX,
    REASON_MAX_LENGTH,
    TENANCY_GENERIC_ERROR_MESSAGE,
    TENANCY_NAME_MAX_LENGTH,
    TENANCY_PATH_PATTERN,
    isDefaultTenancy,
    workspaceInvitationsKey,
    workspaceMembersKey,
    isLegacyTenancy,
    tenancyErrorMessage,
    tenancyNamespace,
} from "../TenancyConstants";

describe("tenancy constants", () => {
    test("are the contract's values", () => {
        expect(DEFAULT_TENANCY).toBe("datamap/production/public");
        expect(PRODUCTION_PREFIX).toBe("datamap/production/");
        expect(LEGACY_PREFIX).toBe("datamap/staging/");
        expect(NAMESPACE_PATTERN.test("data-amazon")).toBe(true);
        expect(NAMESPACE_PATTERN.test("Data Amazon")).toBe(false);
        expect(TENANCY_NAME_MAX_LENGTH).toBe(128);
        expect(REASON_MAX_LENGTH).toBe(1000);
    });

    test("tell public, legacy and the namespace from a path", () => {
        expect(isDefaultTenancy("datamap/production/public")).toBe(true);
        expect(isDefaultTenancy("datamap/production/data-amazon")).toBe(false);
        expect(isLegacyTenancy("datamap/staging/data-amazon")).toBe(true);
        expect(isLegacyTenancy("datamap/production/data-amazon")).toBe(false);
        expect(tenancyNamespace("datamap/production/data-amazon")).toBe("data-amazon");
    });

    test("a tenancy path is plain segments, nothing that could leave the gatekeeper route it is put in", () => {
        expect(TENANCY_PATH_PATTERN.test("datamap/production/atto")).toBe(true);
        expect(TENANCY_PATH_PATTERN.test("datamap/staging/data-amazon")).toBe(true);
        for (const value of ["atto", "datamap/../users", "datamap//atto", "datamap/production/atto?x=1", "/datamap/production/atto", "datamap/production/atto/", "../../admin/tenancies"]) {
            expect(TENANCY_PATH_PATTERN.test(value)).toBe(false);
        }
    });

    test("a known error code has its own sentence", () => {
        expect(tenancyErrorMessage("request_pending")).toBe("You already have a request waiting. Withdraw it to send another.");
        expect(tenancyErrorMessage("too_many_requests")).toBe("You have sent three requests in the last 24 hours. Try again tomorrow.");
        expect(tenancyErrorMessage("tenancy_not_found")).toBe("You are not a member of this tenancy.");
        expect(tenancyErrorMessage("forbidden")).toBe("Only the member who sent an invitation can withdraw it.");
    });

    test("anything else is the generic sentence, including names an object already has", () => {
        expect(tenancyErrorMessage(undefined)).toBe(TENANCY_GENERIC_ERROR_MESSAGE);
        expect(tenancyErrorMessage("made_up")).toBe(TENANCY_GENERIC_ERROR_MESSAGE);
        expect(tenancyErrorMessage("constructor")).toBe(TENANCY_GENERIC_ERROR_MESSAGE);
    });

    test("the members-access error of a public dataset is explained where the embargo screens show errors", () => {
        const error = new APIError("BAD_REQUEST", 400, "public_members_cannot_edit", true, undefined, "public_members_cannot_edit");

        expect(messageForApiError(error)).toBe("Members of Public can only read. Share the dataset with the people who should edit it.");
    });

    test("a dataset sent with another tenancy is told that datasets stay where they were created", () => {
        const error = new APIError("BAD_REQUEST", 400, "tenancy_cannot_change", true, undefined, "tenancy_cannot_change");

        expect(messageForApiError(error)).toBe("A dataset stays in the tenancy it was created in.");
        expect(tenancyErrorMessage("tenancy_cannot_change")).toBe("A dataset stays in the tenancy it was created in.");
    });

    test("the workspace keys carry the tenancy encoded in the query, members 50 at a time", () => {
        expect(workspaceMembersKey("datamap/production/data-amazon", 50)).toBe("/api/workspace/members?tenancy=datamap%2Fproduction%2Fdata-amazon&limit=50&offset=50");
        expect(workspaceInvitationsKey("datamap/production/data-amazon")).toBe("/api/workspace/invitations?tenancy=datamap%2Fproduction%2Fdata-amazon");
    });
});
