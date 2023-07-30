
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import auth from "../../lib/auth";
import { getUserBy } from "../../lib/users";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(auth)
  .get((req, res) => {
    const user = getUserBy("fake-uid-from-token-jwt");
    res.json({ user });
  });

export default router.handler({
  onError: (err, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});