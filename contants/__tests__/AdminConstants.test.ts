import { ADMIN_COPY, ADMIN_TABS, adminErrorFrom, adminErrorMessage, slugifyNamespace } from "../AdminConstants";

const GENERIC = "Something went wrong. Please try again.";

describe("admin error messages", () => {
    test("every code the admin routes answer has its own words", () => {
        const codes = [
            "invalid_request", "namespace_invalid", "display_name_invalid", "message_invalid",
            "request_not_found", "tenancy_not_found", "no_account", "member_not_found", "invitation_not_found",
            "request_not_pending", "already_member", "tenancy_exists", "display_name_taken",
            "requester_email_unverified", "public_tenancy_locked", "legacy_tenancy_read_only", "tenancy_disabled", "not_found",
        ];
        for (const code of codes) {
            expect(adminErrorMessage(code)).not.toBe(GENERIC);
        }
        expect(adminErrorMessage("requester_email_unverified")).toBe(ADMIN_COPY.unverifiedBanner);
    });

    test("an unknown code, or none, reads as a generic failure", () => {
        expect(adminErrorMessage("made_up")).toBe(GENERIC);
        expect(adminErrorMessage(undefined)).toBe(GENERIC);
        expect(adminErrorMessage("unavailable")).toBe(GENERIC);
        expect(adminErrorMessage("constructor")).toBe(GENERIC);
    });

    test("reads the code from an Axios error, and nothing else", () => {
        expect(adminErrorFrom({ response: { status: 409, data: { detail: "display_name_taken" } } })).toBe("Another tenancy already has this display name.");
        expect(adminErrorFrom(new Error("network"))).toBe(GENERIC);
        expect(adminErrorFrom({ response: { data: { detail: { nested: true } } } })).toBe(GENERIC);
    });
});

describe("slugifyNamespace", () => {
    test("turns a display name into a namespace, accents dropped rather than split", () => {
        expect(slugifyNamespace("Cerrado Flux")).toBe("cerrado-flux");
        expect(slugifyNamespace("  LBA Legacy!! ")).toBe("lba-legacy");
        expect(slugifyNamespace("Data_Amazon 2")).toBe("data-amazon-2");
        expect(slugifyNamespace("João Silva")).toBe("joao-silva");
        expect(slugifyNamespace("João Ciência")).toBe("joao-ciencia");
        expect(slugifyNamespace("---")).toBe("");
        expect(slugifyNamespace("a".repeat(100))).toHaveLength(63);
        expect(slugifyNamespace("a".repeat(62) + " bcd")).toBe("a".repeat(62));
    });
});

describe("the admin tabs", () => {
    test("are Requests, Users, Tenancies and Activity, in that order, and only Requests counts", () => {
        expect(ADMIN_TABS.map((tab) => tab.label)).toEqual(["Requests", "Users", "Tenancies", "Activity"]);
        expect(ADMIN_TABS.map((tab) => tab.href)).toEqual(["/app/admin/requests", "/app/admin/users", "/app/admin/tenancies", "/app/admin/activity"]);
        expect(ADMIN_TABS.filter((tab) => tab.showsOpenCount).map((tab) => tab.label)).toEqual(["Requests"]);
    });
});
