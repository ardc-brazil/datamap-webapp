
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { createRouter } from "next-connect";
import { TENANCY_STORAGE_NAME } from "../types/TenancyStore";

const router = createRouter<NextApiRequest, NextApiResponse>();

const middlewareChain = router.use(auth, tenancyChecker)

async function auth(req: NextApiRequest, res: NextApiResponse, next: any) {
    const token = await getToken({ req })
    if (!token) {
        res.status(401).end("401 Unauthorized");
    } else {
        await next(); // call next in chain
    }
}

async function tenancyChecker(req: NextApiRequest, res: NextApiResponse, next: any) {
    const tenancyData = (req?.cookies as { [key: string]: string })?.[TENANCY_STORAGE_NAME] ?? null

    if (tenancyData || req.headers['x-datamap-tenancy']) {
        await next();   
    } else {
        res.status(400)
        .json({
            "code": "40001",
            "message": "tenancy not found",
        });        
    }    
}

export default middlewareChain;