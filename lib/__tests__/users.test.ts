import { describe, expect, test } from '@jest/globals';
import { canEditDataset } from "../users";

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
