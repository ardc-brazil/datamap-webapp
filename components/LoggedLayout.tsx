import Link from "next/link";
import Head from "../node_modules/next/head";
import { useRouter } from "next/router";
import { useState } from "react";

interface Props {
  children?: React.ReactNode;
  fluid?: boolean;
  footerPropsMarginTop?: boolean;
  hideFooter?: boolean;
  className?: string;
}

export default (props: Props) => {
  const [menuClosed, setMenuClosed] = useState(false);

  function toggleMenu(): void {
    setMenuClosed(!menuClosed);
  }

  return (
    <>
      <Head>
        <title>DataMap</title>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8"></meta>
      </Head>

      <main className="flex flex-nowrap flex-row">
        {/* <Navbar /> */}
        <aside className={`flex-none w-64 h-screen overflow-auto border-r border-primary-200 ${menuClosed ? "transition-all duration-500 ease-out w-16" : "transition-all duration-500 ease-out w-64"}`}>
          <div>
            <div className="flex items-center pl-4 h-16">
              <button className="btn-primary-outline border-0 rounded-full p-2" onClick={toggleMenu}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7 text-primary-900"
                  fill="none"
                  viewBox="0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-width="2" d="M5 8h18M5 13h18M5 18h18" />
                </svg>
              </button>
              <Link href="/">
                <a className="w-full pl-4 flex items-start">
                  <img src="/img/logo.svg" alt="DataMap" className="h-9" />
                </a>
              </Link>
            </div>

            <ul className="py-4">
              <MenuItem href="/">Home</MenuItem>
              <MenuItem href="/datasets">Datasets</MenuItem>
              <MenuItem href="/search">Search</MenuItem>
            </ul>
          </div>
        </aside>
        <div className={`${props.fluid ? "" : "px-8 pt-8"}`}>
          {props.children}
        </div>
      </main>
    </>
  );
};

function MenuItem(props) {
  const router = useRouter();

  function active(href: string) {
    var pathName = router.pathname.split("/");
    return "/" + pathName[1] == href;
  }

  return (
    <li
      className={` ${
        active(props.href) ? "border-r-2 border-r-primary-800" : ""
      } flex items-center pointer-events-auto hover:bg-primary-100 h-11`}
    >
      <Link href={props.href}>
        <a
          className={`flex items-center mx-2 h-full w-full pl-6 group text-primary-700 font-normal`}
        >
          <svg
            className="w-5 h-5 inline-block"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 22 21"
          >
            <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
            <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
          </svg>

          <span className="ml-3">{props.children}</span>
        </a>
      </Link>
    </li>
  );
}
