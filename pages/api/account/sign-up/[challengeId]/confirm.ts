import { confirmSignUp } from "../../../../../lib/account";
import { accountHandler, isUuid, publicAccountRouter } from "../../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        const challengeId = req.query.challengeId as string;
        if (!isUuid(challengeId)) {
            res.status(404).json({ detail: "challenge_not_found" });
            return;
        }
        await confirmSignUp(challengeId, req.body?.code);
        res.status(204).end();
    });

export default accountHandler(router);
