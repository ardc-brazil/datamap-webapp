
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import { publishDatasetVersion } from "../../../lib/dataset";
import middlewareChain from "../../../lib/middlewareChain";
import { httpErrorHandler } from "../../../lib/rpc";
import { PublishDatasetVersionRequest } from "../../../types/BffAPI";
import { ResponseError } from "../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(middlewareChain)
  // PUT /versions/:versionName
  .put(async (req, res) => {
    const context = await NewContext(req);
    const apiRequest = req.body as PublishDatasetVersionRequest;
    const result = await publishDatasetVersion(context, apiRequest);
    res.json(result);
  });

export default router.handler({
  onError: (err: ResponseError, req, res) => {
    const e = httpErrorHandler(err)
    res.status(e.httpCode).json(e);
  },
});
