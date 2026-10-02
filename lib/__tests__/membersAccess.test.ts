import { describe, expect, test } from '@jest/globals';
import {
    canChangeMembersAccess,
    membersAccessDetail,
    membersAfterEmbargoLine,
    membersCanEditOf,
    membersOutcomeSentence,
} from "../membersAccess";

describe("what members can do", () => {
    test("the share state's row wins, the dataset is the fallback, and missing means the default", () => {
        const dataset: any = { members_can_edit: false };

        expect(membersCanEditOf(dataset, { tenancy: { members_can_edit: true } } as any)).toBe(true);
        expect(membersCanEditOf(dataset, { tenancy: null } as any)).toBe(false);
        expect(membersCanEditOf(dataset)).toBe(false);
        expect(membersCanEditOf({} as any)).toBe(true);
    });

    test("only the owner changes it", () => {
        expect(canChangeMembersAccess({ access: { level: "owner" } } as any)).toBe(true);
        expect(canChangeMembersAccess({ access: { level: "write" } } as any)).toBe(false);
        expect(canChangeMembersAccess({} as any)).toBe(false);
    });

    test("the row, without an embargo", () => {
        expect(membersAccessDetail({ membersCanEdit: true, embargoActive: false, members: 14 }))
            .toBe("14 people · can read and edit");
        expect(membersAccessDetail({ membersCanEdit: false, embargoActive: false, members: 14 }))
            .toBe("14 people · can read · editing limited to the people above");
        expect(membersAccessDetail({ membersCanEdit: true, embargoActive: false, members: 1 }))
            .toBe("1 person · can read and edit");
    });

    test("the row, during an embargo, says what comes afterwards", () => {
        expect(membersAccessDetail({ membersCanEdit: true, embargoActive: true, members: 14 }))
            .toBe("No access during the embargo · afterwards: read and edit");
        expect(membersAccessDetail({ membersCanEdit: false, embargoActive: true }))
            .toBe("No access during the embargo · afterwards: read only");
    });

    test("the line under the embargo choice", () => {
        expect(membersAfterEmbargoLine("Data Amazon", true))
            .toBe("When the embargo ends, members of Data Amazon can read and edit again.");
        expect(membersAfterEmbargoLine("Data Amazon", false))
            .toBe("When the embargo ends, members of Data Amazon can read but not edit.");
    });

    test("the sentence of the ended banner", () => {
        expect(membersOutcomeSentence("Data Amazon", true))
            .toBe("Members of Data Amazon can read and edit this dataset again; the people you shared it with keep their access.");
        expect(membersOutcomeSentence("Data Amazon", false))
            .toBe("Members of Data Amazon can read this dataset; editing stays with the people you shared it with.");
    });
});
