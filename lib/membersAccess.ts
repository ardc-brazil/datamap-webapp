import { PUBLIC_MEMBERS_DETAIL, isDefaultTenancy } from "../contants/TenancyConstants";
import { GetDatasetDetailsResponse } from "../types/BffAPI";
import { ShareState } from "../types/GatekeeperAPI";

function inPublic(dataset: GetDatasetDetailsResponse, state?: ShareState | null): boolean {
    return isDefaultTenancy(dataset?.tenancy ?? "") || state?.tenancy?.is_default === true;
}

export function membersCanEditOf(dataset: GetDatasetDetailsResponse, state?: ShareState | null): boolean {
    if (inPublic(dataset, state)) {
        return false;
    }
    if (state?.tenancy) {
        return state.tenancy.members_can_edit !== false;
    }
    return dataset?.members_can_edit !== false;
}

export function canChangeMembersAccess(dataset: GetDatasetDetailsResponse): boolean {
    return dataset?.access?.level === "owner" && !isDefaultTenancy(dataset?.tenancy ?? "");
}

export function membersAccessDetail(options: { membersCanEdit: boolean, embargoActive: boolean, members?: number | null, everyone?: boolean }): string {
    if (options.embargoActive) {
        return `No access during the embargo · afterwards: ${options.membersCanEdit ? "read and edit" : "read only"}`;
    }
    if (options.everyone) {
        return PUBLIC_MEMBERS_DETAIL;
    }
    const what = options.membersCanEdit ? "can read and edit" : "can read · editing limited to the people above";
    if (options.members === undefined || options.members === null) {
        return what;
    }
    return `${options.members} ${options.members === 1 ? "person" : "people"} · ${what}`;
}

export function membersAfterEmbargoLine(tenancyName: string, membersCanEdit: boolean): string {
    return membersCanEdit
        ? `When the embargo ends, members of ${tenancyName} can read and edit again.`
        : `When the embargo ends, members of ${tenancyName} can read but not edit.`;
}

export function membersOutcomeSentence(tenancyName: string, membersCanEdit: boolean): string {
    return membersCanEdit
        ? `Members of ${tenancyName} can read and edit this dataset again; the people you shared it with keep their access.`
        : `Members of ${tenancyName} can read this dataset; editing stays with the people you shared it with.`;
}
