import type { NextApiRequest, NextApiResponse } from "next";
import { ADMIN_PAGE_SIZE, ADMIN_USER_SEARCH_MIN_LENGTH } from "../contants/AdminConstants";
import { TENANCY_PATH_PATTERN } from "../contants/TenancyConstants";
import { AdminRequestsQuery, TenancyDecision, TenancyRequestKind } from "../types/GatekeeperAPI";
import { invalidRequest, pageOr400 } from "./routeParams";

export function requestsQueryOr400(req: NextApiRequest, res: NextApiResponse): AdminRequestsQuery | undefined {
    const status = req.query.status ?? "open";
    const kind = req.query.kind;
    const q = req.query.q;
    if ((status !== "open" && status !== "closed")
        || (kind !== undefined && kind !== "join" && kind !== "new")
        || (q !== undefined && typeof q !== "string")) {
        return invalidRequest(res);
    }
    const page = pageOr400(req, res, ADMIN_PAGE_SIZE);
    if (!page) {
        return undefined;
    }
    const search = typeof q === "string" ? q.trim() : "";
    return {
        status: status as "open" | "closed",
        ...(status === "open" && kind ? { kind: kind as TenancyRequestKind } : {}),
        ...(search ? { q: search } : {}),
        ...page,
    };
}

export function decisionOr400(req: NextApiRequest, res: NextApiResponse): TenancyDecision | undefined {
    const body = req.body ?? {};
    const hasTenancy = body.tenancy !== undefined;
    const hasNew = body.newTenancy !== undefined;
    if (hasTenancy && !hasNew && typeof body.tenancy === "string" && TENANCY_PATH_PATTERN.test(body.tenancy)) {
        return { tenancy: body.tenancy };
    }
    const fresh = body.newTenancy;
    if (hasNew && !hasTenancy && typeof fresh?.displayName === "string" && typeof fresh?.namespace === "string") {
        return { newTenancy: { displayName: fresh.displayName, namespace: fresh.namespace } };
    }
    return invalidRequest(res);
}

export function declineMessageOr400(req: NextApiRequest, res: NextApiResponse): { message?: string } | undefined {
    const message = req.body?.message;
    if (message === undefined || message === null) {
        return {};
    }
    return typeof message === "string" ? { message } : invalidRequest(res);
}

export function newTenancyOr400(req: NextApiRequest, res: NextApiResponse): { displayName: string; namespace: string } | undefined {
    const { displayName, namespace } = req.body ?? {};
    return typeof displayName === "string" && typeof namespace === "string"
        ? { displayName, namespace }
        : invalidRequest(res);
}

export function userSearchOr400(req: NextApiRequest, res: NextApiResponse): string | undefined {
    const q = req.query.q;
    const value = typeof q === "string" ? q.trim() : "";
    return value.length >= ADMIN_USER_SEARCH_MIN_LENGTH ? value : invalidRequest(res);
}
