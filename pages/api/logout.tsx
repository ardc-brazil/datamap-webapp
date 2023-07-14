import { createRouter } from "next-connect";
import auth from "../../middleware/auth";

const router = createRouter();

router
  .use(auth) //
  .get((req, res) => {
    req.logOut();
    res.status(204).end();
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
