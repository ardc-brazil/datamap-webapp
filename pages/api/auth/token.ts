
import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { NewContext } from "../../../lib/appLocalContext";
import auth from "../../../lib/auth";
import { getUserByUID } from "../../../lib/users";
import { FileUploadAuthTokenRequest, FileUploadAuthTokenResponse } from "../../../types/BffAPI";
import { ResponseError } from "../../../types/ResponseError";

const router = createRouter<NextApiRequest, NextApiResponse>();
const authFileUploadTokenSecret = process.env.AUTH_FILE_UPLOAD_TOKEN_SECRET;

router
    .use(auth)
    .post(async (req, res) => {
        const context = await NewContext(req);
        const user = await getUserByUID(context);
        const params = req.body as FileUploadAuthTokenRequest;

        // Generates a new JWT token for file upload.
        const token = jwt.sign(
            {
                iss: 'datamap_bff',
                aud: 'file_upload',
                sub: user.id,
                file: params.file.id
            },
            authFileUploadTokenSecret,
            {
                expiresIn: '1d'
            }
        );

        const response = {
            user: {
                id: user.id
            },
            token: {
                jwt: token
            }
        } as FileUploadAuthTokenResponse;

        res.json(response);
    });

export default router.handler({
    onError: (err: ResponseError, req, res) => {
        console.error(err);
        res.status(err.statusCode || 500).end(err.message);
    },
});