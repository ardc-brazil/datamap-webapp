import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { maskPathTokens } from "./externalCalls";
import { logError } from "./logging";
import { publicChain } from "./middlewareChain";

export function publicAccountRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(publicChain);
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
