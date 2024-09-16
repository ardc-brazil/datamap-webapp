
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import auth from "../../../lib/auth";
import { createDOI, deleteDOI } from "../../../lib/doi";
import { DeleteDOIRequest } from "../../../types/BffAPI";
import { ResponseError } from "../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
    .use(auth)
    .post(async (req, res) => {
        try {
            const context = await NewContext(req);
            const result = await createDOI(context, req.body);
            res.json(result);
        } catch (error) {
            res.status(error?.status).end()
        }
    })
    .delete(async (req, res) => {
        const context = await NewContext(req);
        try {
            await deleteDOI(context, req.body as DeleteDOIRequest);
            res.status(200).end();
        } catch (e) {
            console.log(e);
            res.status(e.response.status).end();
        }
    });

export default router.handler({
    onError: (err: ResponseError, req, res) => {
        console.error(err.stack);
        res.status(err.statusCode || 500).end(err.message);
    },
});