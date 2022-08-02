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
          <meta
            name="viewport"
            content="width=device-width, inicital-scale=1"
          ></meta>
          <link
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
            rel="stylesheet"
            integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
            crossOrigin="anonymous"
          />
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
