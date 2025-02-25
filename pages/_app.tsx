import "../styles/globals.css";

import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import type { AppProps } from "next/app";
import Router, { useRouter } from 'next/router';
import 'react-material-symbols/outlined';
import { useTenancyStore } from "../components/TenancyStore";

interface CustomAppProps {
  Component: AppProps["Component"] & {
    auth: {
      // User role to view this page
      // This is not used yet.
      role: string
      // The component that should be visible when the page is loading
      loading: any
    }
  }
  pageProps: AppProps<{ session: Session }>["pageProps"]
}

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: CustomAppProps) {
  return (
    <SessionProvider session={session}  >
      {Component.auth ? (
        <Auth authContext={Component.auth}>
          <Component {...pageProps} />
        </Auth>
      ) : (
        <Component {...pageProps} />
      )}
    </SessionProvider>
  )
}

function Auth({ authContext, children }) {
  const { data: session } = useSession();
  const setTenancySelected = useTenancyStore((state) => state.setTenancySelected)
  const isTenancySelected = useTenancyStore((state) => state.isTenancySelected)

  const router = useRouter();

  // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      Router.push("/account/login?error=SessionRequired&callbackUrl=" + router.pathname);
    },
  })

  if (status === "loading") {
    return authContext.loading
  }
  
  // Set the default tenancy if the user have only one, after the login.
  if (!isTenancySelected() && session?.user?.tenancies?.length == 1) {
    setTenancySelected(session.user.tenancies[0]);
  }

  return children
}