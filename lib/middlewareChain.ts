
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { createRouter } from "next-connect";
import { TENANCY_STORAGE_NAME } from "../types/TenancyStore";
import { requestLogging } from "./requestLogging";
import { TOKEN_VERSION } from "./sessionToken";

const router = createRouter<NextApiRequest, NextApiResponse>();

// requestLogging first: a request rejected by auth still deserves a line, and
// the id has to exist before anything downstream can quote it.
const middlewareChain = router.use(requestLogging, auth, tenancyChecker)

// Dataset routes: the gatekeeper decides access per dataset, and an account invited from outside every tenancy has none to select.
export const authOnlyChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging, auth);

// Account routes a signed-out visitor needs: sign-up, code confirmation, password reset.
export const publicChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging);

// Email-verification routes: an ORCID sign-in that has no account, or no confirmed email, yet.
export const pendingOnlyChain = createRouter<NextApiRequest, NextApiResponse>().use(requestLogging, pendingOnly);

async function auth(req: NextApiRequest, res: NextApiResponse, next: any) {
    const token = await getToken({ req })
    if (!token?.uid || token.v !== TOKEN_VERSION) {
        res.status(401).end("401 Unauthorized");
    } else {
        await next();
    }
}

async function pendingOnly(req: NextApiRequest, res: NextApiResponse, next: any) {
    const token = await getToken({ req })
    if (!token?.pending || token.uid || token.v !== TOKEN_VERSION) {
        res.status(401).end("401 Unauthorized");
    } else {
        await next();
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