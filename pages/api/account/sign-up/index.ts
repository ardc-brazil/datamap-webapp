import { signUp } from "../../../../lib/account";
import { accountHandler, publicAccountRouter } from "../../../../lib/accountRoute";

const router = publicAccountRouter()
    .post(async (req, res) => {
        const { name, email, password } = req.body ?? {};
        res.status(202).json(await signUp({ name, email, password }));
    });

export default accountHandler(router);
