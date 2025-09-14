import Head from "../node_modules/next/head";
import { Navbar } from "./Navbar/Navbar";
import { Footer } from "./Footer";

interface Props {
  children?: React.ReactNode;
  fluid?: boolean;
  footerPropsMarginTop?: boolean;
  hideFooter?: boolean;
  bgColor?: string;
}

export default (props: Props) => {

  const bgColor = props.bgColor ? props.bgColor :"bg-primary-50";

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
        } mx-auto ${bgColor}`}
      >
        {props.children}
      </main>
      {!props.hideFooter && <Footer marginTop={props.footerPropsMarginTop} />}
    </div>
  );
};
