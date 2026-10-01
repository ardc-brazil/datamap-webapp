import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/img/brand/datamap-favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/img/brand/datamap-app-icon-180.png" />
        <meta name="theme-color" content="#fafaf9" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
