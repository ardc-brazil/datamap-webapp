import { anonymousMetadataEntries } from "../../lib/anonymousMetadata";

export function AnonymousMetadataList(props: { data: Record<string, unknown> }) {
    return (
        <div className="rounded-lg border border-primary-200 bg-primary-0">
            {anonymousMetadataEntries(props.data).map((entry) => (
                <div key={entry.key} className="grid grid-cols-[120px_minmax(0,1fr)] sm:grid-cols-[170px_minmax(0,1fr)] items-center px-4 py-3 border-b border-primary-100 last:border-b-0 text-sm">
                    <span className="text-primary-500">{entry.label}</span>
                    <span className={entry.redacted ? "font-mono text-xs text-primary-700" : "text-primary-900"}>{entry.value}</span>
                </div>
            ))}
        </div>
    );
}
