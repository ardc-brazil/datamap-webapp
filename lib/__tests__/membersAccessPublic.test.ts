import { describe, expect, test } from '@jest/globals';
import { DEFAULT_TENANCY } from "../../contants/TenancyConstants";
import { canChangeMembersAccess, inPublic, membersAccessDetail, membersCanEditOf, membersCanEditToSend } from "../membersAccess";

describe("members of Public", () => {
    test("never edit a public dataset, whatever the column or the share state says", () => {
        expect(membersCanEditOf({ tenancy: DEFAULT_TENANCY, members_can_edit: true } as any)).toBe(false);
        expect(membersCanEditOf({ tenancy: DEFAULT_TENANCY } as any, { tenancy: { members_can_edit: true } } as any)).toBe(false);
    });

    test("the share state saying the tenancy is the default one is enough", () => {
        expect(membersCanEditOf({} as any, { tenancy: { is_default: true, members_can_edit: true } } as any)).toBe(false);
    });

    test("the owner of a public dataset has nothing to change; elsewhere the owner still does", () => {
        expect(canChangeMembersAccess({ tenancy: DEFAULT_TENANCY, access: { level: "owner" } } as any)).toBe(false);
        expect(canChangeMembersAccess({ tenancy: "datamap/production/data-amazon", access: { level: "owner" } } as any)).toBe(true);
    });

    test("inPublic is exported so components share the one check membersCanEditOf uses", () => {
        expect(inPublic({ tenancy: DEFAULT_TENANCY } as any)).toBe(true);
        expect(inPublic({} as any, { tenancy: { is_default: true } } as any)).toBe(true);
        expect(inPublic({ tenancy: "datamap/production/data-amazon" } as any)).toBe(false);
    });

    test("the row reads Everyone on DataMap, and an embargo still says what comes after", () => {
        expect(membersAccessDetail({ membersCanEdit: false, embargoActive: false, members: 47, everyone: true })).toBe("Everyone on DataMap · can read");
        expect(membersAccessDetail({ membersCanEdit: false, embargoActive: true, everyone: true })).toBe("No access during the embargo · afterwards: read only");
    });

    test("the value sent in Public is never true", () => {
        expect(membersCanEditToSend(true, true)).toBe(false);
        expect(membersCanEditToSend(true, false)).toBe(false);
        expect(membersCanEditToSend(false, true)).toBe(true);
        expect(membersCanEditToSend(false, false)).toBe(false);
    });
});
