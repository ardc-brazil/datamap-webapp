
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import auth from "../../lib/auth";
import { ResponseError } from "../../types/ResponseError";
import { getUserByUID } from "../../lib/users";
import { NewContext } from "../../lib/appLocalContext";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(auth)
  .get(async (req, res) => {
    const context = await NewContext(req);
    const user = await getUserByUID(context);
    res.json({ user });
  });

export default router.handler({
  onError: (err: ResponseError, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});