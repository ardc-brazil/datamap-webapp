import "../styles/globals.css";

import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Router, { useRouter } from 'next/router';
import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";
import 'react-material-symbols/outlined';
import { useTenancyStore } from "../components/TenancyStore";
import { loginUrlFor } from "../lib/authRoutes";
import { reportWebVital, setCurrentPage, startTelemetry, trackPageView } from "../lib/telemetryClient";

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

const inter = Inter({ subsets: ["latin"], display: "swap" });

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: CustomAppProps) {
  useBrowserTelemetry();

  return (
    <SessionProvider session={session}  >
      <style jsx global>{`
        :root {
          --font-inter: ${inter.style.fontFamily};
        }
      `}</style>
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

function useBrowserTelemetry() {
  const router = useRouter();

  useReportWebVitals((metric) => reportWebVital(metric));

  useEffect(() => {
    startTelemetry();
    // pathname is the page template, /app/datasets/[datasetId], never the id.
    const onPageShown = () => {
      setCurrentPage(Router.pathname);
      trackPageView();
    };
    onPageShown();
    router.events.on("routeChangeComplete", onPageShown);
    return () => router.events.off("routeChangeComplete", onPageShown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      Router.replace(loginUrlFor(router.asPath));
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