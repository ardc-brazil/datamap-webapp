import type { NextApiRequest, NextApiResponse } from "next";
import { isUuid } from "./accountRoute";

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
