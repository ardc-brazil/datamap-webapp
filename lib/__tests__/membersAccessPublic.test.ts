import { describe, expect, test } from '@jest/globals';
import { DEFAULT_TENANCY } from "../../contants/TenancyConstants";
import { canChangeMembersAccess, membersAccessDetail, membersCanEditOf } from "../membersAccess";

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

    test("the row reads Everyone on DataMap, and an embargo still says what comes after", () => {
        expect(membersAccessDetail({ membersCanEdit: false, embargoActive: false, members: 47, everyone: true })).toBe("Everyone on DataMap · can read");
        expect(membersAccessDetail({ membersCanEdit: false, embargoActive: true, everyone: true })).toBe("No access during the embargo · afterwards: read only");
    });
});
