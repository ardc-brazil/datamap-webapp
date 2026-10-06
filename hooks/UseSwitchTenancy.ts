import Router from "next/router";
import { useCallback } from "react";
import { useTenancyStore } from "../components/TenancyStore";
import { ROUTE_PAGE_HOME } from "../contants/InternalRoutesConstants";
import { trackUiEvent } from "../lib/telemetryClient";

export function useSwitchTenancy(): (path: string) => void {
    const setTenancySelected = useTenancyStore((state) => state.setTenancySelected);
    return useCallback((path: string) => {
        trackUiEvent("tenancy_switched");
        setTenancySelected(path);
        Router.push(ROUTE_PAGE_HOME);
    }, [setTenancySelected]);
}
