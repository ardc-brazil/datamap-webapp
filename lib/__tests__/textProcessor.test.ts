import { plural } from "../textProcessor";

describe("plural", () => {
    test("one or many", () => {
        expect(plural(1, "dataset", "datasets")).toBe("dataset");
        expect(plural(0, "dataset", "datasets")).toBe("datasets");
        expect(plural(108, "dataset", "datasets")).toBe("datasets");
    });
});
