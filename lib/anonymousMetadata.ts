import { REDACTED } from "../contants/EmbargoConstants";
import { AnonymousPageVersion } from "../types/GatekeeperAPI";

const LABELS: Record<string, string> = {
    authors: "Authors",
    institution: "Institution",
    project: "Project",
    license: "License",
    category: "Category",
    start_date: "Start date",
    end_date: "End date",
    location: "Location",
    reference: "References",
    references: "References",
    additional_information: "Additional information",
    citation: "Citation",
    colaborators: "Collaborators",
    contacts: "Contacts",
    creation_date: "Created",
    data_type: "Data type",
    database: "Database",
    grid_type: "Grid type",
    level: "Level",
    owner: "Owner",
    realm: "Realm",
    resolution: "Resolution",
    source: "Source",
    source_instrument: "Source instrument",
    tags: "Tags",
    variables: "Variables",
};

const ORDER = Object.keys(LABELS);
const NOT_LISTED = new Set(["description", "is_enabled", "id", "name", "version"]);

export function displayValue(value: unknown): string {
    if (value === null || value === undefined || value === "") {
        return "—";
    }
    if (Array.isArray(value)) {
        return value.length === 0 ? "—" : value.map(displayValue).join(" · ");
    }
    if (typeof value === "object") {
        const parts = Object.values(value as Record<string, unknown>).map(displayValue).filter((part) => part !== "—");
        return parts.length ? parts.join(" · ") : "—";
    }
    return String(value);
}

function rank(key: string): number {
    const index = ORDER.indexOf(key);
    return index < 0 ? ORDER.length : index;
}

export function anonymousMetadataEntries(data: Record<string, unknown>): { key: string, label: string, value: string, redacted: boolean }[] {
    return Object.keys(data)
        .filter((key) => !NOT_LISTED.has(key))
        .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
        .map((key) => {
            const value = displayValue(data[key]);
            return { key, label: LABELS[key] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), value, redacted: value.includes(REDACTED) };
        });
}

export function authorCount(data: Record<string, unknown>): number {
    return Array.isArray(data?.authors) ? data.authors.length : 0;
}

export function latestVersion(versions: AnonymousPageVersion[]): AnonymousPageVersion | undefined {
    return [...(versions ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function extensionLabel(extension: string | null): string {
    return extension ?? "no extension";
}
