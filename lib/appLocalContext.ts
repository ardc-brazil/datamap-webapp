import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server"

/**
 * Represents request app context
 * @interface
 */
export interface AppLocalContext {
    /**
     * UserID (UUID) information from context.
     */
    uid: string
}

export async function NewContext(req: NextRequest | NextApiRequest): Promise<AppLocalContext> {
    const token = await getToken({ req: req })

    return {
        uid: token?.uid as string
    };
}
