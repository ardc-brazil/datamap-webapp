import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../../../lib/appLocalContext";
import { getDatasetSnapshot } from "../../../../../lib/dataset";
import middlewareChain from "../../../../../lib/middlewareChain";
import { ResponseError } from "../../../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(middlewareChain)
  .get(async (req, res) => {
    const context = await NewContext(req);
    const { datasetId } = req.query;

    try {
      if (!datasetId || typeof datasetId !== 'string') {
        return res.status(400).json({ error: 'Dataset ID is required' });
      }

      // Get current version snapshot (no version name specified)
      const dataset = await getDatasetSnapshot(context, datasetId);
      
      res.json(dataset);
    } catch (error) {
      console.error('Error fetching dataset snapshot:', error);
      
      if (error?.response?.status) {
        res.status(error.response.status).json({
          error: error.response.data?.message || 'Failed to fetch dataset snapshot'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error while fetching dataset snapshot'
        });
      }
    }
  });

export default router.handler({
  onError: (err: ResponseError, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
      error: err.message || 'Internal server error'
    });
  },
});
