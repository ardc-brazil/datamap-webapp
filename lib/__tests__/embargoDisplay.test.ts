import { describe, expect, test } from '@jest/globals';
import {
    calendarDaysFromToday,
    daysFromToday,
    daysLeft,
    describeAccessEvent,
    describeLinkStats,
    formatHistoryWhen,
    formatShortDate,
    initialsOf,
    tenancyDisplayName,
} from "../embargoDisplay";

const NOW = new Date("2026-10-01T10:00:00Z");

function entry(overrides: any): any {
    return { event_type: "created", occurred_at: "2026-09-09T17:28:00Z", actor: { id: "u", name: "Luciana Rizzo" }, subject: null, old_value: null, new_value: null, note: null, ...overrides };
}

describe("dates and counts", () => {
    test("short dates, with and without the year", () => {
        expect(formatShortDate("2026-12-15T23:59:59+00:00")).toBe("Dec 15, 2026");
        expect(formatShortDate("2026-12-15T23:59:59+00:00", false)).toBe("Dec 15");
    });

    test("the history's moment, in UTC", () => {
        expect(formatHistoryWhen("2026-09-26T14:02:00Z")).toBe("Sep 26, 2026 14:02");
    });

    test("days left round up and never go below zero", () => {
        expect(daysLeft("2026-12-15T23:59:59+00:00", NOW)).toBe(76);
        expect(daysLeft("2026-09-01T23:59:59+00:00", NOW)).toBe(0);
    });

    test("days from today to a chosen date", () => {
        expect(daysFromToday("2026-12-15", NOW)).toBe(75);
    });

    test("calendar days from today to a moment count by UTC date, not by elapsed hours", () => {
        expect(calendarDaysFromToday("2026-09-30T23:59:00Z", NOW)).toBe(-1);
        expect(calendarDaysFromToday("2026-10-01T00:01:00Z", NOW)).toBe(0);
        expect(calendarDaysFromToday("2026-10-02T00:01:00Z", NOW)).toBe(1);
    });
});

describe("names", () => {
    test("a tenancy is named by its last segment", () => {
        expect(tenancyDisplayName("datamap/production/data-amazon")).toBe("Data Amazon");
        expect(tenancyDisplayName(undefined)).toBe("the workspace");
    });

    test("initials of a name", () => {
        expect(initialsOf("Luciana Varanda Rizzo")).toBe("LR");
        expect(initialsOf("ana")).toBe("A");
        expect(initialsOf("")).toBe("?");
    });
});

describe("anonymous link stats", () => {
    test("a link never opened", () => {
        expect(describeLinkStats({ created_at: "2026-09-26T10:00:00Z", views: { count: 0, first_at: null, last_at: null } } as any, NOW))
            .toBe("Created Sep 26 · not opened yet");
    });

    test("a link opened yesterday", () => {
        expect(describeLinkStats({ created_at: "2026-09-14T10:00:00Z", views: { count: 12, first_at: "2026-09-16T10:00:00Z", last_at: "2026-09-30T09:00:00Z" } } as any, NOW))
            .toBe("Created Sep 14 · first opened Sep 16 · last opened yesterday");
    });
});

describe("describeAccessEvent", () => {
    test("setting an embargo", () => {
        expect(describeAccessEvent(entry({ new_value: { until: "2026-11-30T23:59:59+00:00", metadata_visible: false }, note: "Under review at JGR Atmospheres" })))
            .toEqual({ icon: "lock", who: "Luciana Rizzo", what: "set an embargo until Nov 30, 2026", detail: "hidden from members · \"Under review at JGR Atmospheres\"" });
    });

    test("an extension says what it was and why", () => {
        expect(describeAccessEvent(entry({ event_type: "extended", old_value: { until: "2026-11-30T23:59:59+00:00" }, new_value: { until: "2026-12-15T23:59:59+00:00" }, note: "Second review round requested" })))
            .toEqual({ icon: "update", who: "Luciana Rizzo", what: "extended the embargo to Dec 15, 2026", detail: "was Nov 30, 2026 · \"Second review round requested\"" });
    });

    test("a grant names the person", () => {
        expect(describeAccessEvent(entry({ event_type: "permission_granted", actor: { id: "a", name: "Alan Calheiros" }, subject: "Caio Maia", new_value: { level: "read" } })))
            .toEqual({ icon: "person_add", who: "Alan Calheiros", what: "granted read access to Caio Maia", detail: "" });
    });

    test("a mode change says which way", () => {
        expect(describeAccessEvent(entry({ event_type: "metadata_mode_changed", old_value: { metadata_visible: false }, new_value: { metadata_visible: true } })).what)
            .toBe("made the dataset visible to members");
    });

    test("an anonymous link shows its label as the detail", () => {
        expect(describeAccessEvent(entry({ event_type: "anonymous_link_created", subject: "AGU Fall Meeting abstract" })))
            .toEqual({ icon: "link", who: "Luciana Rizzo", what: "created anonymous link", detail: "AGU Fall Meeting abstract" });
    });

    test("the system's own events are signed by DataMap", () => {
        expect(describeAccessEvent(entry({ event_type: "expired", actor: null })).who).toBe("DataMap");
    });

    test("an early end by an external DOI says so", () => {
        expect(describeAccessEvent(entry({ event_type: "ended_early", note: "manual DOI" })).detail).toBe("by registering an external DOI");
    });

    test("what members can do, either way", () => {
        expect(describeAccessEvent(entry({ event_type: "members_access_changed", old_value: { members_can_edit: true }, new_value: { members_can_edit: false } })))
            .toEqual({ icon: "edit_off", who: "Luciana Rizzo", what: "made the dataset read only for members of the workspace", detail: "was read and edit" });
        expect(describeAccessEvent(entry({ event_type: "members_access_changed", old_value: { members_can_edit: false }, new_value: { members_can_edit: true } })))
            .toEqual({ icon: "edit", who: "Luciana Rizzo", what: "let members of the workspace edit the dataset", detail: "was read only" });
    });
});
