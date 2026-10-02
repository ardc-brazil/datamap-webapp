import { handleDatasetRequestErrors } from "../requestErrorHandler";

const req = { headers: { host: "datamap.pcs.usp.br" } };

describe("handleDatasetRequestErrors", () => {
    test("a dataset the user cannot see renders the not-found page", () => {
        expect(handleDatasetRequestErrors({ response: { status: 404 } }, req, "d1")).toEqual({ notFound: true });
        expect(handleDatasetRequestErrors({ status: 404 }, req, "d1")).toEqual({ notFound: true });
    });

    test("a 401 still redirects to login", () => {
        const result: any = handleDatasetRequestErrors({ status: 401 }, req, "d1");
        expect(result.redirect.destination).toContain("/account/login");
    });

    test("anything else propagates", () => {
        expect(() => handleDatasetRequestErrors({ status: 500 }, req, "d1")).toThrow();
    });
});
