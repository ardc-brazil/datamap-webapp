import { describe, expect, test } from '@jest/globals';
import { canSeeSettings, hasManualDoi, isFilesWithheld, manualDoiGate, shouldShowEmbargoEndedBanner } from "../embargoState";

function dataset(overrides: any = {}): any {
    return {
        id: "d1",
        embargo: { until: "2026-09-01T23:59:59+00:00", active: false, metadata_visible: false, note: null },
        access: { level: "owner", can_edit: true, can_share: true, can_manage_embargo: true, can_extend_embargo: false, can_delete: true },
        current_version: { name: "1", doi: { state: "REGISTERED" }, files_withheld: false },
        ...overrides,
    };
}

describe('shouldShowEmbargoEndedBanner', () => {
    test('the owner sees it after the embargo while the DOI is not findable', () => {
        expect(shouldShowEmbargoEndedBanner(dataset())).toBe(true);
    });

    test('not once the DOI is findable', () => {
        expect(shouldShowEmbargoEndedBanner(dataset({ current_version: { doi: { state: "FINDABLE" } } }))).toBe(false);
    });

    test('not while the embargo lasts', () => {
        expect(shouldShowEmbargoEndedBanner(dataset({ embargo: { until: "2026-12-01T23:59:59+00:00", active: true } }))).toBe(false);
    });

    test('not for someone other than the owner', () => {
        expect(shouldShowEmbargoEndedBanner(dataset({ access: { level: "write" } }))).toBe(false);
    });

    test('not for a dataset that never had an embargo', () => {
        expect(shouldShowEmbargoEndedBanner(dataset({ embargo: null }))).toBe(false);
    });
});

describe('isFilesWithheld', () => {
    test('true when the current version withholds its files', () => {
        expect(isFilesWithheld(dataset({ current_version: { files_withheld: true } }))).toBe(true);
    });

    test('false otherwise', () => {
        expect(isFilesWithheld(dataset())).toBe(false);
    });
});

describe('canSeeSettings', () => {
    test('an editor sees settings', () => {
        expect(canSeeSettings(dataset({ access: undefined }), true)).toBe(true);
    });

    test('someone who can only extend still sees settings', () => {
        expect(canSeeSettings(dataset({ access: { can_extend_embargo: true, can_manage_embargo: false } }), false)).toBe(true);
    });

    test('a reader does not', () => {
        expect(canSeeSettings(dataset({ access: { can_extend_embargo: false, can_manage_embargo: false } }), false)).toBe(false);
    });
});

describe('manual DOI', () => {
    const active = { until: "2026-12-01T23:59:59+00:00", active: true, metadata_visible: false, note: null };

    test('under embargo, the owner may end it by registering one', () => {
        expect(manualDoiGate(dataset({ embargo: active }))).toBe("ends_embargo");
    });

    test('under embargo, anyone else is told only the owner can', () => {
        expect(manualDoiGate(dataset({ embargo: active, access: { level: "write", can_manage_embargo: false } }))).toBe("owner_only");
        expect(manualDoiGate(dataset({ embargo: active, access: undefined }))).toBe("owner_only");
    });

    test('without an embargo, registering one rules out a future embargo', () => {
        expect(manualDoiGate(dataset({ embargo: null }))).toBe("blocks_future_embargo");
        expect(manualDoiGate(dataset())).toBe("blocks_future_embargo");
    });

    test('a manual DOI on any version counts', () => {
        expect(hasManualDoi(dataset({ versions: [{ doi: null }, { doi: { mode: "MANUAL" } }] }))).toBe(true);
        expect(hasManualDoi(dataset({ versions: [{ doi: { mode: "AUTO" } }] }))).toBe(false);
        expect(hasManualDoi(dataset({ versions: undefined }))).toBe(false);
    });
});
