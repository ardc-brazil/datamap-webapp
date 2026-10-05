import { getToken } from "next-auth/jwt";
import { accountHandler, requireJsonRequest } from "../../../lib/accountRoute";
import { bffRouter } from "../../../lib/bffRoute";
import { setOrcidLinkIntent } from "../../../lib/orcidLinkIntent";

/** Marks the ORCID sign-in that follows as "link to this account", so it can never replace the session with another account. */
const router = bffRouter()
    .post(requireJsonRequest, async (req, res) => {
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            throw new Error("NEXTAUTH_SECRET is not set");
        }
        const token = await getToken({ req });
        setOrcidLinkIntent(res, token.uid as string, secret);
        res.status(204).end();
    });

export default accountHandler(router);
