import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { ShareState } from "../../types/GatekeeperAPI";
import { ShareDialog } from "./ShareDialog";

export function ShareButton(props: { dataset: GetDatasetDetailsResponse }) {
    const [show, setShow] = useState(false);
    const { data } = useSWR(`/api/datasets/${props.dataset.id}/share`, fetcher);
    const people = data ? 1 + (data as ShareState).permissions.length : null;

    return (
        <>
            <button
                type="button"
                aria-label="Share"
                className="inline-flex items-center gap-2 h-[38px] px-3.5 rounded-md border border-primary-300 bg-primary-0 text-primary-900 text-sm font-semibold whitespace-nowrap hover:bg-primary-100 transition-colors"
                onClick={() => setShow(true)}
            >
                <MaterialSymbol icon="group" size={18} grade={-25} weight={400} /> Share
                {people !== null && <span className="rounded-full bg-primary-200 px-[7px] py-px text-[11px] text-primary-700">{people}</span>}
            </button>
            <ShareDialog dataset={props.dataset} show={show} onClose={() => setShow(false)} />
        </>
    );
}
