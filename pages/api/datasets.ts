
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import auth from "../../lib/auth";
import { createDataset, getAllDataset } from "../../lib/dataset";
import { ResponseError } from "../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(auth)
  .get(async (req, res) => {
    const result = await getAllDataset();
    res.json(result);
  })
  .post(async (req, res) => {
    const result = await createDataset(req.body.datasetTitle);
    res.json(result);
  });

export default router.handler({
  onError: (err: ResponseError, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});