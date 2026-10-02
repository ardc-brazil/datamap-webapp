import { describe, expect, test } from '@jest/globals';
import { APIError } from "../../types/APIError";
import { EMBARGO_ERROR_MESSAGES, GENERIC_ERROR_MESSAGE, messageForApiError } from "../EmbargoConstants";

describe('messageForApiError', () => {
    test('a known error code becomes its message', () => {
        const error = new APIError("BAD_REQUEST", 400, "Invalid client input", true, [{ code: "embargo_too_long" }]);
        expect(messageForApiError(error)).toBe(EMBARGO_ERROR_MESSAGES.embargo_too_long);
    })

    test('a 403 says the action is not allowed', () => {
        const error = new APIError("FORBIDDEN", 403, "forbidden", true);
        expect(messageForApiError(error)).toBe("You are not allowed to do this on this dataset.");
    })

    test('a 404 says the dataset is gone or out of reach', () => {
        const error = new APIError("NOT_FOUND", 404, "Resource does not exists", true);
        expect(messageForApiError(error)).toBe("This dataset no longer exists, or you no longer have access to it.");
    })

    test('anything else is the generic message', () => {
        expect(messageForApiError(new Error("boom"))).toBe(GENERIC_ERROR_MESSAGE);
        expect(messageForApiError(undefined)).toBe(GENERIC_ERROR_MESSAGE);
    })

    test('every contract error code has a message', () => {
        const codes = [
            "embargo_too_long", "embargo_until_in_past", "embargo_dataset_published", "embargo_already_active",
            "embargo_not_active", "embargo_until_not_later", "embargo_active",
            "share_target_required", "share_target_ambiguous", "invalid_email", "invalid_orcid",
            "already_has_access", "cannot_share_with_owner", "invalid_level", "unknown_user",
            "embargo_manual_doi", "embargo_manual_doi_ends_embargo",
        ];
        expect(codes.filter((code) => !EMBARGO_ERROR_MESSAGES[code])).toEqual([]);
    })
})
