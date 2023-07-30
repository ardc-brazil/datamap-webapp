
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

const auth = router.use(async (req, res, next) => {
    const token = await getToken({ req })
    if (!token) {
        res.status(401).end("401 Unauthorized");
    } else {
        await next(); // call next in chain
    }
})


export default auth;