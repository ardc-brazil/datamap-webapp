
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import auth from "../../../lib/auth";
import { deleteDataset, getDatasetCategoryFilters, updateDataset } from "../../../lib/dataset";
import { ResponseError } from "../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(auth)
  .put(async (req, res) => {
    const context = await NewContext(req);
    const result = await updateDataset(context, req.body);
    res.json(result);
  })
  .get(async (req, res) => {
    const context = await NewContext(req);
    const { datasetId } = req.query

    if (datasetId === "filters") {
      const result = await getDatasetCategoryFilters(context);
      res.json(result);
    } else {
      res.status(404).end();
    }
  })
  .delete(async (req, res) => {
    const context = await NewContext(req);
    const { datasetId } = req.query
    try {
      await deleteDataset(context, datasetId as string);
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