import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { maskPathTokens } from "./externalCalls";
import { logError } from "./logging";
import { pendingOnlyChain, publicChain } from "./middlewareChain";
import { uuidOr404 } from "./routeParams";

export { isUuid } from "./routeParams";

/** Every public challenge route takes the same id from the same place; a non-UUID never reaches the gatekeeper. */
export function challengeIdOr404(req: NextApiRequest, res: NextApiResponse): string | undefined {
    return uuidOr404(req, res, "challengeId", "challenge_not_found");
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

/** For a route with no body to read: a request without a content type is refused too, since only a script can send application/json. */
export async function requireJsonRequest(req: NextApiRequest, res: NextApiResponse, next: () => Promise<unknown>) {
    const contentType = req.headers["content-type"];
    const value = Array.isArray(contentType) ? contentType[0] : contentType;
    if (typeof value !== "string" || !JSON_CONTENT_TYPE.test(value)) {
        res.status(415).json({ detail: "invalid_request" });
        return;
    }
    await next();
}

export function publicAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(publicChain).use(requireJsonContentType);
}

/** Email verification of an ORCID sign-in that has no account, or no confirmed email, yet. */
export function pendingAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(pendingOnlyChain).use(requireJsonContentType);
}

/** A gatekeeper `detail` that is not a string code (a FastAPI 422 list, for one) never reaches the browser. */
export function gatekeeperDetail(body: unknown): string | undefined {
    const detail = (body as { detail?: unknown } | undefined)?.detail;
    return typeof detail === "string" ? detail : undefined;
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
            res.status(status).json({ detail: gatekeeperDetail(response?.data) ?? "unavailable" });
        },
        onNoMatch: (req, res) => {
            res.status(405).end(`Method ${req.method} not allowed`);
        },
    });
}
