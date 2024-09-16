
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import auth from "../../../lib/auth";
import { deleteDOI } from "../../../lib/doi";
import { ResponseError } from "../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
    .use(auth)
    .delete(async (req, res) => {
        const context = await NewContext(req);
        const { doiId } = req.query
        try {
            await deleteDOI(context, doiId as string);
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