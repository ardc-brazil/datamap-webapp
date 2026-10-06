import { GatekeeperPage } from "../types/GatekeeperAPI";

export function isLastPage(page: GatekeeperPage<unknown>): boolean {
    return page.offset + page.items.length >= page.total_count;
}

export function nextPageCount(total: number, loaded: number, pageSize: number): number {
    return Math.min(pageSize, total - loaded);
}

export function lastPageOffset(totalCount: number, limit: number): number {
    return Math.max(0, Math.floor((totalCount - 1) / limit) * limit);
}
