
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import auth from "../../../lib/auth";
import { createDataset, getAllDataset } from "../../../lib/dataset";
import { ResponseError } from "../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(auth)
  .get(async (req, res) => {
    try {
      const context = await NewContext(req);
      const response = await getAllDataset(context, req.url)

      res.json(response);

    } catch (error) {
      console.log(error)
      res.status(error?.response?.status).end();
    }
  })
  .post(async (req, res) => {
    try {
      const context = await NewContext(req);
      const result = await createDataset(context, req.body);
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