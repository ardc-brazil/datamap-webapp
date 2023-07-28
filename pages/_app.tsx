import "../styles/globals.css";

import type { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import type { AppProps } from "next/app";
import Router, { useRouter } from 'next/router';


// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <SessionProvider session={session}  >
      {Component.auth ? (
        <Auth>
          <Component {...pageProps} />
        </Auth>
      ) : (
        <Component {...pageProps} />
      )}
    </SessionProvider>
  )
}


function Auth({ children }) {

  const router = useRouter();

  // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      Router.push("/account/login?error=SessionRequired&callbackUrl=" + router.pathname);
    },
  })

  if (status === "loading") {
    return <div>Loading...</div>
  }

  return children
}