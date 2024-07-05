
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import auth from "../../../lib/auth";
import { publishDatasetVersion } from "../../../lib/dataset";
import { PublishDatasetVersionRequest } from "../../../types/BffAPI";
import { ResponseError } from "../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(auth)
  // PUT /versions/:versionName
  .put(async (req, res) => {
    try {
      const context = await NewContext(req);
      const apiRequest = req.body as PublishDatasetVersionRequest;
      const result = await publishDatasetVersion(context, apiRequest);
      res.json(result);
    } catch (error) {
      res.status(error?.response?.status).end()
    }
  });

export default router.handler({
  onError: (err: ResponseError, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});