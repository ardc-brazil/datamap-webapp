import { readFileSync } from "fs";
import { join } from "path";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function png(name: string): Buffer {
    return readFileSync(join(__dirname, "..", "..", "public", "img", "email", name));
}

describe("the images the gatekeeper's emails load from the webapp", () => {
    test.each([
        ["datamap-tile-36.png", 72],
        ["datamap-tile-22.png", 44],
    ])("%s is a %ipx square PNG under public/img/email", (name, size) => {
        const bytes = png(name);

        expect(bytes.subarray(0, 8)).toEqual(PNG_SIGNATURE);
        expect(bytes.readUInt32BE(16)).toBe(size);
        expect(bytes.readUInt32BE(20)).toBe(size);
    });
});
