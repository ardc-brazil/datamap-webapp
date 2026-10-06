import { GatekeeperPage } from "../types/GatekeeperAPI";

export function isLastPage(page: GatekeeperPage<unknown>): boolean {
    return page.offset + page.items.length >= page.total_count;
}

export function nextPageCount(total: number, loaded: number, pageSize: number): number {
    return Math.min(pageSize, total - loaded);
}
