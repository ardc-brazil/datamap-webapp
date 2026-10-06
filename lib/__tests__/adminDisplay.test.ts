import { adminRequest, DATA_AMAZON } from "../../fake-data/adminFixtures";
import { closedOutcome, closedTenancyName, plural, requestTarget, requestedAgo, waitingLabel } from "../adminDisplay";

const NOW = new Date("2026-10-04T12:00:00Z");

describe("how long a request has waited", () => {
    test("counts calendar days and goes stale from the third", () => {
        expect(waitingLabel("2026-10-04T08:00:00+00:00", NOW)).toEqual({ text: "today", stale: false });
        expect(waitingLabel("2026-10-03T23:00:00+00:00", NOW)).toEqual({ text: "1 day waiting", stale: false });
        expect(waitingLabel("2026-10-02T09:00:00+00:00", NOW)).toEqual({ text: "2 days waiting", stale: false });
        expect(waitingLabel("2026-10-01T09:00:00+00:00", NOW)).toEqual({ text: "3 days waiting", stale: true });
        expect(waitingLabel("2026-09-28T16:20:00+00:00", NOW)).toEqual({ text: "6 days waiting", stale: true });
    });

    test("reads as a relative date in the review dialog", () => {
        expect(requestedAgo("2026-10-04T08:00:00+00:00", NOW)).toBe("today");
        expect(requestedAgo("2026-10-03T09:00:00+00:00", NOW)).toBe("yesterday");
        expect(requestedAgo("2026-09-28T16:20:00+00:00", NOW)).toBe("6 days ago");
    });
});

describe("names", () => {
    test("a request names the suggested tenancy, else what the user typed", () => {
        expect(requestTarget(adminRequest())).toBe("Data Amazon");
        expect(requestTarget(adminRequest({ suggested_tenancy: null, requested_name: "Cerrado Flux" }))).toBe("Cerrado Flux");
    });
});

describe("a closed request", () => {
    test("says how it ended and where", () => {
        const approved = adminRequest({ status: "approved", tenancy: DATA_AMAZON, requested_name: "data amazon" });
        const created = adminRequest({ status: "approved", created_tenancy: true, tenancy: { ...DATA_AMAZON, path: "datamap/production/cerrado-flux", display_name: "Cerrado Flux" } });
        const declined = adminRequest({ status: "declined", requested_name: "ATTO" });

        expect(closedOutcome(approved)).toEqual({ text: "Approved", tone: "approved" });
        expect(closedOutcome(created)).toEqual({ text: "Approved · new tenancy", tone: "approved" });
        expect(closedOutcome(declined)).toEqual({ text: "Declined", tone: "declined" });
        expect(closedTenancyName(approved)).toBe("Data Amazon");
        expect(closedTenancyName(declined)).toBe("ATTO");
    });
});

describe("plural", () => {
    test("one or many", () => {
        expect(plural(1, "dataset", "datasets")).toBe("dataset");
        expect(plural(0, "dataset", "datasets")).toBe("datasets");
        expect(plural(108, "dataset", "datasets")).toBe("datasets");
    });
});
