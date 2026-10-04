import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { maskPathTokens } from "./externalCalls";
import { logError } from "./logging";
import { publicChain } from "./middlewareChain";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID.test(value);
}

/** Every public challenge route takes the same id from the same place; a non-UUID never reaches the gatekeeper. */
export function challengeIdOr404(req: NextApiRequest, res: NextApiResponse): string | undefined {
    const challengeId = req.query.challengeId as string;
    if (isUuid(challengeId)) {
        return challengeId;
    }
    res.status(404).json({ detail: "challenge_not_found" });
    return undefined;
}

const JSON_CONTENT_TYPE = /^application\/json\b/i;
const METHODS_WITH_A_BODY = new Set(["POST", "PUT", "PATCH"]);

// A browser form can only send application/x-www-form-urlencoded, multipart/form-data or text/plain, so requiring JSON keeps a cross-site form out.
async function requireJsonContentType(req: NextApiRequest, res: NextApiResponse, next: () => Promise<unknown>) {
    const contentType = req.headers["content-type"];
    const value = Array.isArray(contentType) ? contentType[0] : contentType;
    if (METHODS_WITH_A_BODY.has((req.method ?? "").toUpperCase()) && value !== undefined && !JSON_CONTENT_TYPE.test(value)) {
        res.status(415).json({ detail: "invalid_request" });
        return;
    }
    await next();
}

export function publicAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(publicChain).use(requireJsonContentType);
}

/** The account screens map the gatekeeper's `detail` codes to their own copy, so both reach the browser as they were. */
export function accountHandler(router: ReturnType<typeof createRouter<NextApiRequest, NextApiResponse>>) {
    return router.handler({
        onError: (err: unknown, req, res) => {
            const response = axios.isAxiosError(err) ? err.response : undefined;
            const status = response?.status ?? 500;
            if (status >= 500) {
                logError("account route failed", err, { method: req.method, path: maskPathTokens((req.url ?? "").split("?")[0]) });
            }
            res.status(status).json({ detail: response?.data?.detail ?? "unavailable" });
        },
        onNoMatch: (req, res) => {
            res.status(405).end(`Method ${req.method} not allowed`);
        },
    });
}
