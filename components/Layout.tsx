import { AppProps } from "../node_modules/next/app";
import Head from "../node_modules/next/head";
import Menu from "./Menu";

type Props = {
  children?: React.ReactNode;
};

export default (props: Props) => {
  return (
    <>
      <Head>
        <title>PoliData</title>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8"></meta>
      </Head>

      <Menu />
      <main className="container px-4 mx-auto bg-primary-50">{props.children}</main>
    </>
  );
};
