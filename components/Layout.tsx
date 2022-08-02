import { AppProps } from "../node_modules/next/app";
import Head from "../node_modules/next/head";
import Menu from "./Menu";

type Props = {
  children? : React.ReactNode
};

export default (props: Props) => {
  return (
    <>
      <div className="container">
        <Head>
          <title>PoliData</title>
          <link rel="icon" href="/favicon.ico" />
          <meta charSet="utf-8"></meta>
        </Head>

        <div>
          <div className="container-fluid py-4">
            <Menu />
            {props.children}
          </div>
        </div>
      </div>
    </>
  );
};
