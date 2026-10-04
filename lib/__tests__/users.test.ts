import { describe, expect, test } from '@jest/globals';
import { canEditDataset, canSeeAccessHistory, hasSignInProvider } from "../users";

const editor: any = { roles: ["datasets_write"] };
const reader: any = { roles: ["datasets_read"] };

describe("canEditDataset", () => {
    test("without access flags, the role decides", () => {
        expect(canEditDataset(editor)).toBe(true);
        expect(canEditDataset(reader)).toBe(false);
    });

    test("the dataset's access flags win over the role", () => {
        expect(canEditDataset(editor, { access: { can_edit: false } } as any)).toBe(false);
        expect(canEditDataset(reader, { access: { can_edit: true } } as any)).toBe(true);
    });
});

describe("canSeeAccessHistory", () => {
    const withAccess = (level: string, canEdit: boolean): any => ({ access: { level, can_edit: canEdit } });

    test("the owner and write collaborators see the history", () => {
        expect(canSeeAccessHistory(reader, withAccess("owner", true))).toBe(true);
        expect(canSeeAccessHistory(reader, withAccess("write", true))).toBe(true);
    });

    test("a tenancy editor does not, even though it can edit", () => {
        expect(canSeeAccessHistory(editor, withAccess("tenancy", true))).toBe(false);
    });

    test("readers do not", () => {
        expect(canSeeAccessHistory(editor, withAccess("read", false))).toBe(false);
    });

    test("without access flags, the role decides", () => {
        expect(canSeeAccessHistory(editor)).toBe(true);
        expect(canSeeAccessHistory(reader)).toBe(false);
    });
});

describe("hasSignInProvider", () => {
    test("finds a provider by name", () => {
        expect(hasSignInProvider({ providers: [{ name: "orcid" }] }, "orcid")).toBe(true);
    });

    test("an account without it, or without providers, does not have it", () => {
        expect(hasSignInProvider({ providers: [{ name: "github" }] }, "orcid")).toBe(false);
        expect(hasSignInProvider({ providers: [] }, "orcid")).toBe(false);
        expect(hasSignInProvider({}, "orcid")).toBe(false);
        expect(hasSignInProvider(undefined, "orcid")).toBe(false);
    });
});
