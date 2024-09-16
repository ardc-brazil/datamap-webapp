
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import auth from "../../../lib/auth";
import { createDOI } from "../../../lib/doi";
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
    });

export default router.handler({
    onError: (err: ResponseError, req, res) => {
        console.error(err.stack);
        res.status(err.statusCode || 500).end(err.message);
    },
});