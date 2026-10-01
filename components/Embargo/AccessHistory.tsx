import { MaterialSymbol } from "react-material-symbols";
import useSWR from "swr";
import { describeAccessEvent, formatHistoryWhen } from "../../lib/embargoDisplay";
import { fetcher } from "../../lib/fetcher";
import { AccessHistoryResponse } from "../../types/GatekeeperAPI";
import { SettingsBlock } from "./EmbargoSettingsSection";

export function AccessHistory(props: { datasetId: string }) {
    const { data } = useSWR(`/api/datasets/${props.datasetId}/access-events`, fetcher);
    const items = [...((data as AccessHistoryResponse)?.items ?? [])]
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

    if (items.length === 0) {
        return null;
    }

    return (
        <SettingsBlock title="History">
            <ul className="m-0 p-0 list-none rounded-lg border border-primary-200 bg-primary-0">
                {items.map((entry, index) => {
                    const row = describeAccessEvent(entry);
                    return (
                        <li key={index} className="grid grid-cols-[28px_minmax(0,1fr)_150px] gap-3 items-start px-4 py-3 border-b border-primary-100 last:border-b-0 text-sm leading-5">
                            <MaterialSymbol icon={row.icon as any} size={18} grade={-25} weight={400} className="pt-px text-primary-500" aria-hidden="true" />
                            <span className="min-w-0">
                                <strong className="font-semibold text-primary-900">{row.who}</strong> <span className="text-primary-700">{row.what}</span>
                                {row.detail && <span className="block text-xs text-primary-500">{row.detail}</span>}
                            </span>
                            <span className="text-right font-mono text-xs text-primary-500">{formatHistoryWhen(entry.occurred_at)}</span>
                        </li>
                    );
                })}
            </ul>
        </SettingsBlock>
    );
}
