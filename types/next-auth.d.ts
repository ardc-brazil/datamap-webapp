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

            /** The account holds the global admin role. */
            admin: boolean

            /** Pre-fills the confirmation field of a pending sign-in. */
            emailHint?: string
        } & DefaultSession["user"]
    }

    interface User {
        /** Set only by the development ORCID mock: the public email ORCID would have returned. */
        publicEmail?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        uid?: string
        tenancies?: string[]
        v?: number
        pending?: PendingSignIn
        admin?: boolean
    }
}
