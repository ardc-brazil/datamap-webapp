import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server"
import { defaultTenancy } from "../lib/rpc";

/**
 * Represents request app context
 * @interface
 */
export interface AppLocalContext {
    /**
     * UserID (UUID) information from context.
     */
    uid: string

    /**
     * Tenancies list (string) is the list of product/application context enabled for user.
     */
    tenancies?: string[]
}

export async function NewContext(req: NextRequest | NextApiRequest): Promise<AppLocalContext> {
    const token = await getToken({ req: req })

    return {
        uid: token?.uid as string,
        tenancies: buildTenancy(token),
    };
}


function buildTenancy(token): string[] {
    return token?.tenancies as string[] ?? [defaultTenancy];
}