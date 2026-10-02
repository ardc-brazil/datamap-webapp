import { MaterialSymbol } from "react-material-symbols";
import { extensionLabel } from "../../lib/anonymousMetadata";
import { bytesToSize } from "../../lib/file";
import { AnonymousPageVersion } from "../../types/GatekeeperAPI";

export function AnonymousFilesCard(props: { version?: AnonymousPageVersion }) {
    const summary = props.version?.files_summary;

    return (
        <div className="rounded-lg border border-primary-200 bg-primary-0">
            <div className="flex gap-3 items-center px-4 py-3.5 border-b border-primary-100 text-sm text-primary-900">
                <MaterialSymbol icon="folder" size={20} grade={-25} weight={400} className="text-primary-500" aria-hidden="true" />
                <span className="font-semibold">{summary?.count ?? 0} files · {bytesToSize(summary?.total_size_bytes ?? 0)}</span>
                <span className="ml-auto text-xs text-primary-400">Names and downloads not available</span>
            </div>
            {(summary?.extensions ?? []).length > 0 &&
                <div className="flex flex-wrap gap-1.5 px-4 py-3">
                    {summary.extensions.map((kind) => (
                        <span key={kind.extension ?? ""} className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs text-primary-700">
                            <span className="font-mono font-semibold">{extensionLabel(kind.extension)}</span>
                            <span className="text-primary-500">{kind.count} · {bytesToSize(kind.total_size_bytes)}</span>
                        </span>
                    ))}
                </div>
            }
        </div>
    );
}
