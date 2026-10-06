import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { ResponseError } from "../types/ResponseError";
import { maskPathTokens } from "./externalCalls";
import { logError } from "./logging";
import { requireJsonRequest } from "./accountRoute";
import { adminChain, authOnlyChain } from "./middlewareChain";
import { httpErrorHandler } from "./rpc";

export function bffRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(authOnlyChain);
}

const CHANGES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function requireJsonOnChanges(req: NextApiRequest, res: NextApiResponse, next: () => Promise<unknown>) {
    if (CHANGES.has((req.method ?? "").toUpperCase())) {
        await requireJsonRequest(req, res, next);
        return;
    }
    await next();
}

/** Admin routes answer through `accountHandler`, which keeps the gatekeeper's `detail` on every status. */
export function adminBffRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(adminChain).use(requireJsonOnChanges);
}

export function bffHandler(router: ReturnType<typeof bffRouter>) {
    return router.handler({
        onError: (err: ResponseError, req, res) => {
            const e = httpErrorHandler(err);
            if (e.httpCode >= 500) {
                logError("bff route failed", err, { method: req.method, path: maskPathTokens((req.url ?? "").split("?")[0]) });
            }
            res.status(e.httpCode).json({ name: e.name, httpCode: e.httpCode, detail: e.detail ?? e.message, errors: e.errors });
        },
        onNoMatch: (req, res) => {
            res.status(405).end(`Method ${req.method} not allowed`);
        },
    });
}
