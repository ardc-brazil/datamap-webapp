import { getToken } from "next-auth/jwt";
import { requestEmailVerification } from "../../../../lib/account";
import { accountHandler, pendingAccountRouter } from "../../../../lib/accountRoute";

const router = pendingAccountRouter()
    .post(async (req, res) => {
        const { pending } = await getToken({ req });
        const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
        res.status(202).json(await requestEmailVerification({ orcid: pending.orcid, name: pending.name, email }));
    });

export default accountHandler(router);
