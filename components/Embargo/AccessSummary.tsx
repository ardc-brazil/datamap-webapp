import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { ShareState } from "../../types/GatekeeperAPI";
import { ShareDialog } from "../Share/ShareDialog";
import { SettingsBlock } from "./EmbargoSettingsSection";

export function AccessSummary(props: { dataset: GetDatasetDetailsResponse }) {
    const [show, setShow] = useState(false);
    const canShare = props.dataset.access?.can_share === true;
    const { data } = useSWR(canShare ? `/api/datasets/${props.dataset.id}/share` : null, fetcher);
    const state = data as ShareState;

    if (!canShare || !state) {
        return null;
    }

    const names = [state.owner.name, ...state.permissions.map((p) => p.level === "write" ? `${p.user.name} (write)` : p.user.name)];
    const pending = state.invitations.filter((i) => !i.accepted_at && !i.revoked_at).length;
    const links = state.anonymous_links.filter((l) => !l.revoked_at).length;
    const parts = [names.join(", "), pending ? `${pending} pending` : "", links ? `${links} anonymous link${links === 1 ? "" : "s"}` : ""].filter(Boolean);

    return (
        <SettingsBlock title="Access">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-primary-200 bg-primary-0 px-4 py-3.5 text-sm">
                <span className="min-w-0 text-primary-900">{parts.join(" · ")}</span>
                <button type="button" className="text-[13px] font-medium text-primary-600 hover:underline underline-offset-2" onClick={() => setShow(true)}>Open share dialog</button>
            </div>
            <ShareDialog dataset={props.dataset} show={show} onClose={() => setShow(false)} />
        </SettingsBlock>
    );
}
