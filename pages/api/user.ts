import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import auth from "../../middleware/auth";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  // TODO: How to implement auth for all endpoints without `.use(auth)`?
  // --> use this: https://www.npmjs.com/package/next-connect#nextjs-middleware
  // Use middleware implementation
  .use(auth)
  .use(async (req, res, next) => {
    const start = Date.now();
    await next(); // call next in chain
    const end = Date.now();
    console.log(`Request took ${end - start}ms`);
  })
  .get((req, res) => {
    res.json({
      name: "joe"
    });
  });

// router.post((req, res) => {
//   const users = getUsers(req);
//   const newUser = {
//     id: randomId(),
//     ...req.body,
//   } as User;
//   validateUser(newUser);
//   users.push(newUser);
//   saveUsers(res, users);
//   res.json({
//     message: "User has been created",
//   });
// });

// this will run if none of the above matches
router.all((req, res) => {
  res.status(405).json({
    error: "Method not allowed",
  });
});

export default router.handler({
  onError(err, req, res) {
    res.status(500).json({
      error: (err as Error).message,
    });
  },
});