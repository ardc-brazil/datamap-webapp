import Router from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { SHARE_DANGER_ACTION_CLASS } from "../../contants/ShareConstants";
import { tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useLatestTenancyRequest } from "../../hooks/UseTenancies";
import { formatShortDate } from "../../lib/embargoDisplay";
import { trackUiEvent } from "../../lib/telemetryClient";
import { LatestRequestState } from "../../lib/tenancyRequests";
import { useTenancyStore } from "../TenancyStore";
import { TenancyIcon } from "./TenancyIcon";

function useRequestActions() {
    const { state, mutate } = useLatestTenancyRequest();
    const tenancySelected = useTenancyStore((store) => store.tenancySelected);
    const setTenancySelected = useTenancyStore((store) => store.setTenancySelected);
    const [bffGateway] = useState(() => new BFFAPI());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function withdraw(requestId: string) {
        setBusy(true);
        setError(null);
        try {
            await bffGateway.withdrawTenancyRequest(requestId);
            await mutate();
        } catch (e) {
            setError(tenancyErrorMessage(e?.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    }

    function switchTo(path: string) {
        trackUiEvent("tenancy_switched");
        setTenancySelected(path);
        Router.push(ROUTE_PAGE_HOME);
    }

    const visible: LatestRequestState = state?.kind === "approved" && state.request.tenancy?.path === tenancySelected ? null : state;

    return { state: visible, busy, error, withdraw, switchTo };
}

export function TenancyRequestRow(props: { standalone?: boolean }) {
    const { state, busy, error, withdraw, switchTo } = useRequestActions();

    if (!state) {
        return null;
    }

    const { request } = state;
    const row = (
        <li className="flex items-center gap-4 px-4 py-4">
            <TenancyIcon pending={state.kind !== "approved"} />
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold text-primary-900">
                    {state.kind === "approved" ? request.tenancy.display_name : request.requested_name}
                </span>
                {state.kind === "pending" &&
                    <span className="text-[13px] text-embargo-800">{`Requested ${formatShortDate(request.created_at, false)} · waiting for an administrator`}</span>}
                {state.kind === "declined" && <span className="text-[13px] text-primary-600">{`Declined ${formatShortDate(request.decided_at, false)}`}</span>}
                {state.kind === "declined" && request.decision_message &&
                    <span className="text-[13px] text-primary-500">{`“${request.decision_message}”`}</span>}
                {state.kind === "approved" && <span className="text-[13px] text-primary-600">{`Approved ${formatShortDate(request.decided_at, false)}`}</span>}
                {error && <span role="alert" className="text-[13px] text-danger-700">{error}</span>}
            </span>
            {state.kind === "pending" &&
                <button type="button" className={SHARE_DANGER_ACTION_CLASS} disabled={busy} onClick={() => withdraw(request.id)}>Withdraw</button>}
            {state.kind === "approved" &&
                <button type="button" className="btn-primary btn-small m-0" onClick={() => switchTo(request.tenancy.path)}>{`Switch to ${request.tenancy.display_name}`}</button>}
        </li>
    );

    return props.standalone
        ? <ul className="m-0 p-0 list-none rounded-lg border border-primary-200 bg-primary-0">{row}</ul>
        : row;
}

export function TenancyRequestNotice(props: { className?: string }) {
    const { state, busy, error, withdraw, switchTo } = useRequestActions();

    if (!state || state.kind === "declined") {
        return null;
    }

    const { request } = state;
    return (
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-primary-200 bg-primary-0 px-4 py-3 text-sm text-primary-700 ${props.className ?? ""}`}>
            <TenancyIcon pending={state.kind === "pending"} />
            {state.kind === "pending" ? (
                <>
                    <span>{`Your request for ${request.requested_name} is waiting for an administrator`}</span>
                    <span aria-hidden="true">·</span>
                    <button type="button" className={SHARE_DANGER_ACTION_CLASS} disabled={busy} onClick={() => withdraw(request.id)}>Withdraw</button>
                </>
            ) : (
                <>
                    <span>{`Your request for ${request.requested_name} was approved`}</span>
                    <span aria-hidden="true">·</span>
                    <button type="button" className="text-[13px] font-semibold text-primary-900 hover:underline underline-offset-2" onClick={() => switchTo(request.tenancy.path)}>
                        {`Switch to ${request.tenancy.display_name}`}
                    </button>
                </>
            )}
            {error && <span role="alert" className="w-full text-[13px] text-danger-700">{error}</span>}
        </div>
    );
}
