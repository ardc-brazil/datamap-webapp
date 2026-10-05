import type { NextApiRequest, NextApiResponse } from "next";
import { TENANCY_PATH_PATTERN } from "../contants/TenancyConstants";
import { isUuid } from "./accountRoute";

const WHOLE_NUMBER = /^\d+$/;

function wholeNumber(value: string | string[] | undefined, fallback: number): number | null {
    if (value === undefined) {
        return fallback;
    }
    return typeof value === "string" && WHOLE_NUMBER.test(value) ? Number(value) : null;
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
    return limit === null || offset === null ? invalidRequest(res) : { limit, offset };
}

export function userIdOr400(req: NextApiRequest, res: NextApiResponse): string | undefined {
    const userId = req.body?.userId;
    return isUuid(userId) ? userId : invalidRequest(res);
}
