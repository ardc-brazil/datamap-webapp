import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { EMBARGO_ERROR_MESSAGES } from "../../contants/EmbargoConstants";
import { daysLeft, formatShortDate } from "../../lib/embargoDisplay";
import { hasManualDoi } from "../../lib/embargoState";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { EmbargoModeDialog, EmbargoNoteDialog, EndEmbargoDialog, ExtendEmbargoDialog } from "./EmbargoDialogs";
import { SetEmbargoDialog } from "./SetEmbargoDialog";

export function SettingsBlock(props: { title: string, danger?: boolean, children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-x-10 gap-y-3 items-start">
            <span className={`text-[15px] font-semibold ${props.danger ? "text-danger-700" : "text-primary-900"}`}>{props.title}</span>
            {props.children}
        </div>
    );
}

function Row(props: { label: string, children: React.ReactNode, action?: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[180px_minmax(0,1fr)_auto] gap-x-3 items-center px-4 py-3.5 border-b border-primary-100 last:border-b-0 text-sm">
            <span className="text-primary-500">{props.label}</span>
            <span className="min-w-0 text-primary-900">{props.children}</span>
            <span>{props.action}</span>
        </div>
    );
}

function Action(props: { label: string, testId: string, danger?: boolean, onClick(): void }) {
    return (
        <button type="button" data-testid={props.testId} onClick={props.onClick} className={`text-[13px] font-medium hover:underline underline-offset-2 ${props.danger ? "text-danger-700" : "text-primary-600"}`}>
            {props.label}
        </button>
    );
}

export function EmbargoSettingsSection(props: { dataset: GetDatasetDetailsResponse }) {
    const [open, setOpen] = useState<"set" | "extend" | "end" | "mode" | "note" | null>(null);
    const embargo = props.dataset.embargo;
    const access = props.dataset.access;
    const manage = access?.can_manage_embargo === true;
    const close = () => setOpen(null);
    const days = embargo?.active ? daysLeft(embargo.until, new Date()) : 0;

    if (!access || (!manage && !access.can_extend_embargo && !embargo?.active)) {
        return null;
    }

    return (
        <SettingsBlock title="Embargo">
            <div className="rounded-lg border border-primary-200 bg-primary-0">
                {embargo?.active
                    ? <>
                        <Row label="Status" action={manage && <Action label="End early" testId="embargo-end" danger onClick={() => setOpen("end")} />}>
                            <span className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-embargo-100 px-2.5 py-[3px] text-xs font-semibold text-embargo-800">
                                    <MaterialSymbol icon="lock" size={14} grade={-25} weight={400} fill aria-hidden="true" />
                                    Under embargo
                                </span>
                                <span className="text-primary-600">{days} {days === 1 ? "day" : "days"} left</span>
                            </span>
                        </Row>
                        <Row label="Ends" action={access.can_extend_embargo && <Action label="Extend" testId="embargo-extend" onClick={() => setOpen("extend")} />}>
                            {formatShortDate(embargo.until)}
                        </Row>
                        <Row label="Other members" action={manage && <Action testId="embargo-mode" label={embargo.metadata_visible ? "Hide" : "Show"} onClick={() => setOpen("mode")} />}>
                            {embargo.metadata_visible ? "Visible to members" : "Hidden from members"}
                        </Row>
                        <Row label="Note" action={manage && <Action label="Edit" testId="embargo-note" onClick={() => setOpen("note")} />}>
                            <span className="text-primary-700">{embargo.note ?? "No note"}</span>
                        </Row>
                        <Row label="Reminders"><span className="text-primary-700">15, 10, 5 and 1 day before the end</span></Row>
                    </>
                    : <Row label="Status" action={manage && !hasManualDoi(props.dataset) && <Action label="Set embargo" testId="embargo-set" onClick={() => setOpen("set")} />}>
                        <span className="flex flex-col gap-0.5">
                            <span>Not under embargo</span>
                            {manage && hasManualDoi(props.dataset) && <span className="text-[13px] text-primary-500">{EMBARGO_ERROR_MESSAGES.embargo_manual_doi}</span>}
                        </span>
                    </Row>
                }
            </div>
            <SetEmbargoDialog dataset={props.dataset} show={open === "set"} onClose={close} />
            <ExtendEmbargoDialog dataset={props.dataset} show={open === "extend"} onClose={close} />
            <EndEmbargoDialog dataset={props.dataset} show={open === "end"} onClose={close} />
            <EmbargoModeDialog dataset={props.dataset} show={open === "mode"} onClose={close} />
            <EmbargoNoteDialog dataset={props.dataset} show={open === "note"} onClose={close} />
        </SettingsBlock>
    );
}
