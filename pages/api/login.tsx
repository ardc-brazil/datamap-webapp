import passport from "../../lib/passport";

import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import auth from "../../middleware/auth";

const router = createRouter<NextApiRequest, NextApiResponse>();

// // TODO - fix this to redirect to this login page.
// router
//   //.use(auth) //
//   .post(passport.authenticate("local"), (req, res, next) => {
//     console.log("oasis");
//     return res.json({ user: req.user });
//   });

// export default router.handler;

// export default function handler(_req: NextApiRequest, res: NextApiResponse) {
//   return res.status(200).json({ name: "ok" });
// }

router
  .use(auth) //
  .post(passport.authenticate("local"), (req, res) => {
    console.log("pasosu aqui");
    res.json({ user: req.user });
  });

export const config = {
  // runtime: "edge",
  api: {
    externalResolver: true,
  },
};

export default router.handler({
  onError: (err, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});
