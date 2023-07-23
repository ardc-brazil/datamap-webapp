// import passport from '../lib/passport'
// import session from '../lib/session'


import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

// TODO: follow this example to implement auth.
// https://github.com/vercel/next.js/tree/canary/examples/with-passport-and-next-connect
const auth = router
    .use((req, res, next) => {
        console.log("middleware")
        next()
    })

export default auth;
