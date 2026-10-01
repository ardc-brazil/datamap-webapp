import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { ResponseError } from "../types/ResponseError";
import { authOnlyChain } from "./middlewareChain";
import { httpErrorHandler } from "./rpc";

export function bffRouter() {
    return createRouter<NextApiRequest, NextApiResponse>().use(authOnlyChain);
}

export function bffHandler(router: ReturnType<typeof bffRouter>) {
    return router.handler({
        onError: (err: ResponseError, req, res) => {
            const e = httpErrorHandler(err);
            res.status(e.httpCode).json({ name: e.name, httpCode: e.httpCode, detail: e.detail ?? e.message, errors: e.errors });
        },
        onNoMatch: (req, res) => {
            res.status(405).end(`Method ${req.method} not allowed`);
        },
    });
}
