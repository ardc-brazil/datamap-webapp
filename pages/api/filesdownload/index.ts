
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { GatekeeperAPI } from "../../../gateways/GatekeeperAPI";
import { NewContext } from "../../../lib/appLocalContext";
import middlewareChain from "../../../lib/middlewareChain";
import { httpErrorHandler } from "../../../lib/rpc";
import { ResponseError } from "../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
    .use(middlewareChain)
    .post(async (req, res) => {
        const gatekeeperAPI = new GatekeeperAPI();
        const context = await NewContext(req);
        const result = await gatekeeperAPI.generateTemporaryFileDownloadLink(context, req.body);
        res.json(result);
    })

export default router.handler({
    onError: (err: ResponseError, req, res) => {
        const e = httpErrorHandler(err)
        res.status(e.httpCode).json(e);
    },
});