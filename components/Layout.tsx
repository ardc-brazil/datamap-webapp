import Head from "../node_modules/next/head";
import { Navbar } from "./Navbar/Navbar";
import { Footer } from "./Footer";

interface Props {
  children?: React.ReactNode;
  fluid?: boolean;
  footerPropsMarginTop?: boolean;
  hideFooter?: boolean;
}

export default (props: Props) => {
  return (
    <div className="">
      <Head>
        <title>DataMap</title>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8"></meta>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
      </Head>

      <Navbar />
      <main
        className={`${
          props.fluid ? "" : "container pb-4 px-4"
        } mx-auto bg-primary-50`}
      >
        {props.children}
      </main>
      {!props.hideFooter && <Footer marginTop={props.footerPropsMarginTop} />}
    </div>
  );
};
