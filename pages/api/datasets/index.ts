
import axios from "axios";
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
    const context = await NewContext(req);
    getAllDataset(context, req.url)
      .then((result) => {
        res.json(result);
      })
      .catch(error => {
        console.log(error)
        if (axios.isAxiosError(error) && error?.response?.status == 403) {
          res.status(error?.response?.status).end("Forbidden")
        }
      })
  })
  .post(async (req, res) => {
    const context = await NewContext(req);
    const result = await createDataset(context, req.body);
    res.json(result);
  });

export default router.handler({
  onError: (err: ResponseError, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});