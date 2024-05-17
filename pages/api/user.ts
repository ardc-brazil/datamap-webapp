
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import auth from "../../lib/auth";
import { ResponseError } from "../../types/ResponseError";
import { NewContext } from "../../lib/appLocalContext";
import { GatekeeperAPI } from "../../gateways/Gatekeeper";

const router = createRouter<NextApiRequest, NextApiResponse>();
const gatekeeperAPI = new GatekeeperAPI()

router
  .use(auth)
  .get(async (req, res) => {
    const context = await NewContext(req);
    const user = await gatekeeperAPI.getUserByUID(context);
    res.json({ user });
  });

export default router.handler({
  onError: (err: ResponseError, req, res) => {
    console.log(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});