import { describe, expect, test } from '@jest/globals';
import { anonymousPageProps } from "../anonymousPage";

describe("anonymousPageProps", () => {
    test("an active embargo renders the page", () => {
        const page: any = { state: "active", embargo_until: "2026-12-01T23:59:59+00:00", dataset: { name: "x", data: {}, versions: [] } };

        expect(anonymousPageProps(page)).toEqual({ props: { page } });
    });

    test("after the embargo, an unpublished dataset keeps its anonymous page", () => {
        const page: any = { state: "ended", embargo_ended_at: "2026-12-01T23:59:59+00:00", dataset: { name: "x", data: {}, versions: [] } };

        expect(anonymousPageProps(page)).toEqual({ props: { page } });
    });

    test("a published dataset redirects to its public page", () => {
        expect(anonymousPageProps({ state: "published", dataset_id: "d1" }))
            .toEqual({ redirect: { destination: "/datasets/d1", permanent: false } });
    });
});
