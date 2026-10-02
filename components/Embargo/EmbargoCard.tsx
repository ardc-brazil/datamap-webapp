import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { daysLeft, formatShortDate, tenancyDisplayName } from "../../lib/embargoDisplay";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { EmbargoModeDialog, EndEmbargoDialog, ExtendEmbargoDialog } from "./EmbargoDialogs";

export function EmbargoCard(props: { dataset: GetDatasetDetailsResponse }) {
    const [open, setOpen] = useState<"extend" | "end" | "mode" | null>(null);
    const embargo = props.dataset.embargo;
    const access = props.dataset.access;

    if (!embargo?.active || !access || access.level === "tenancy") {
        return null;
    }

    const days = daysLeft(embargo.until, new Date());
    const action = "border border-primary-300 bg-primary-0 rounded-md px-2.5 py-[7px] text-[13px] font-semibold";

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-embargo-200 bg-embargo-50 p-4">
            <div className="flex justify-between items-center">
                <span className="text-[11px] tracking-[0.08em] uppercase font-semibold text-embargo-800">Embargo</span>
                <MaterialSymbol icon="lock" size={18} grade={-25} weight={400} fill className="text-embargo-800" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-[22px] font-semibold tracking-[-0.02em] text-primary-900">{days} {days === 1 ? "day" : "days"} left</span>
                <span className="text-[13px] text-primary-600">Ends {formatShortDate(embargo.until)} · files open to {tenancyDisplayName(props.dataset.tenancy)}</span>
            </div>
            <p className="m-0 text-[13px] leading-[19px] text-primary-600">
                {embargo.metadata_visible ? "Members can see it exists." : "Hidden from members."}
                {access.can_manage_embargo && <> <button type="button" className="font-medium text-primary-900 hover:underline" onClick={() => setOpen("mode")}>Change</button></>}
            </p>
            {embargo.note && <p className="m-0 text-[13px] leading-[19px] italic text-primary-600">“{embargo.note}”</p>}
            {(access.can_extend_embargo || access.can_manage_embargo) &&
                <div className="flex gap-2 mt-1">
                    {access.can_extend_embargo && <button type="button" className={`flex-1 text-primary-900 ${action}`} onClick={() => setOpen("extend")}>Extend</button>}
                    {access.can_manage_embargo && <button type="button" className={`flex-1 text-danger-700 ${action}`} onClick={() => setOpen("end")}>End early</button>}
                </div>
            }
            <ExtendEmbargoDialog dataset={props.dataset} show={open === "extend"} onClose={() => setOpen(null)} />
            <EndEmbargoDialog dataset={props.dataset} show={open === "end"} onClose={() => setOpen(null)} />
            <EmbargoModeDialog dataset={props.dataset} show={open === "mode"} onClose={() => setOpen(null)} />
        </div>
    );
}
