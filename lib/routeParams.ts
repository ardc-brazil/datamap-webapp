import type { NextApiRequest, NextApiResponse } from "next";
import { MAX_PAGE_SIZE, TENANCY_PATH_PATTERN } from "../contants/TenancyConstants";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WHOLE_NUMBER = /^\d+$/;

function wholeNumber(value: string | string[] | undefined, fallback: number): number | null {
    if (value === undefined) {
        return fallback;
    }
    return typeof value === "string" && WHOLE_NUMBER.test(value) ? Number(value) : null;
}

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID.test(value);
}

export function invalidRequest(res: NextApiResponse): undefined {
    res.status(400).json({ detail: "invalid_request" });
    return undefined;
}

export function uuidOr404(req: NextApiRequest, res: NextApiResponse, name: string, detail: string): string | undefined {
    const value = req.query[name];
    if (isUuid(value)) {
        return value;
    }
    res.status(404).json({ detail });
    return undefined;
}

export function tenancyOr400(req: NextApiRequest, res: NextApiResponse): string | undefined {
    const value = req.query.tenancy;
    return typeof value === "string" && TENANCY_PATH_PATTERN.test(value) ? value : invalidRequest(res);
}

export function pageOr400(req: NextApiRequest, res: NextApiResponse, defaultLimit: number): { limit: number; offset: number } | undefined {
    const limit = wholeNumber(req.query.limit, defaultLimit);
    const offset = wholeNumber(req.query.offset, 0);
    if (limit === null || offset === null || limit < 1 || limit > MAX_PAGE_SIZE) {
        return invalidRequest(res);
    }
    return { limit, offset };
}

export function userIdOr400(req: NextApiRequest, res: NextApiResponse): string | undefined {
    const userId = req.body?.userId;
    return isUuid(userId) ? userId : invalidRequest(res);
}
