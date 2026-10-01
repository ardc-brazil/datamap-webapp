import { describe, expect, test } from '@jest/globals';
import { doiLandingProps } from "../doiLanding";

describe("doiLandingProps", () => {
    test("under embargo, only the date and the identifier are shown", () => {
        expect(doiLandingProps({ embargoed: true, until: "2026-12-15T23:59:59+00:00", doi: "10.5281/datamap.3f9c1e" }, "d1", "2"))
            .toEqual({ props: { until: "2026-12-15T23:59:59+00:00", doi: "10.5281/datamap.3f9c1e" } });
    });

    test("otherwise it goes where the DOI has always led", () => {
        expect(doiLandingProps({ embargoed: false, until: null, doi: null }, "d1", "2"))
            .toEqual({ redirect: { destination: "/app/datasets/d1/versions/2", permanent: false } });
    });

    test("when the status cannot be read, it goes there too, and that page enforces access", () => {
        expect(doiLandingProps(null, "d1", "2"))
            .toEqual({ redirect: { destination: "/app/datasets/d1/versions/2", permanent: false } });
    });
});
