import { DefaultSession } from "next-auth"
import type { PendingSignIn } from "../lib/sessionToken"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's unique ID. Absent while the sign-in is pending. */
            uid: string

            /** All available tenancies for a user */
            tenancies: string[]

            /** An ORCID sign-in waiting for a confirmed email. */
            pending: boolean

            /** Pre-fills the confirmation field of a pending sign-in. */
            emailHint?: string
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        uid?: string
        tenancies?: string[]
        accessToken?: string
        v?: number
        pending?: PendingSignIn
    }
}
