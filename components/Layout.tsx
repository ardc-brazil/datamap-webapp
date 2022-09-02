import Head from "../node_modules/next/head";
import { Navbar } from "./Navbar/Navbar";
import { Footer } from "./Footer";

type Props = {
  children?: React.ReactNode;
  fluid?: String
};

export default (props: Props) => {
  return (
    <>
      <Head>
        <title>PoliData</title>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8"></meta>
      </Head>

      <Navbar />
      <main
        className={`${
          props.fluid ? "" : "container pb-4 px-4"
        } mx-auto bg-primary-50`}
      >
        {props.children}
      </main>
      <Footer />
    </>
  );
};
