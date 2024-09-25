
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import auth from "../../../lib/auth";
import { createDOI, deleteDOI, navigateDOIToStatus } from "../../../lib/doi";
import { DeleteDOIRequest, NavigateDOIStatusRequest } from "../../../types/BffAPI";
import { ResponseError } from "../../../types/ResponseError";
import { httpErrorHandler } from "../../../lib/rpc";


const router = createRouter<NextApiRequest, NextApiResponse>();

router
    .use(auth)
    .post(async (req, res) => {
        const context = await NewContext(req);
        const result = await createDOI(context, req.body);
        res.json(result);
    })
    .delete(async (req, res) => {
        const context = await NewContext(req);
        await deleteDOI(context, req.body as DeleteDOIRequest);
        res.status(200).end();
    })
    .put(async (req, res) => {
        const context = await NewContext(req);
        await navigateDOIToStatus(context, req.body as NavigateDOIStatusRequest);
        res.status(200).end();
    })

export default router.handler({
    onError: (err: ResponseError, req, res) => {
        // TODO: Implement this error handler for other APIs
        // All the endpoints should use the same httpErrorHandler
        const e = httpErrorHandler(err)
        res.status(e.httpCode).json(e);
    },
});