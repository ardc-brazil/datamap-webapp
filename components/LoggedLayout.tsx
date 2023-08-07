import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_NEW, ROUTE_PAGE_HOME, ROUTE_PAGE_PROFILE } from "../contants/InternalRoutesConstants";
import Head from "../node_modules/next/head";
import AvatarIcon from "./Icons/AvatarIcon";
import DatasetIcon from "./Icons/DatasetIcon";
import PiechartIcon from "./Icons/PiechartIcon";
import AvatarButton from "./Profile/AvatarButton";

interface Props {
  children?: React.ReactNode;
  noPadding?: boolean;
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
        <aside
          className={`flex-none w-64 h-screen overflow-auto border-r border-primary-200 ${menuClosed
            ? "transition-all duration-300 ease-out w-16"
            : "transition-all duration-300 ease-out w-64"
            } fixed`}
        >
          <div className="flex items-center pl-4 h-16">
            <button
              className="btn-primary-outline border-0 rounded-full p-2"
              onClick={toggleMenu}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-primary-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeWidth="2" d="M3 8h18M3 13h18M3 18h18" />
              </svg>
            </button>
            <Link href="/">
              <a className="w-full pl-4 flex items-start">
                <img src="/img/logo.svg" alt="DataMap" className="h-9" />
              </a>
            </Link>
          </div>



          <div className="flex items-center justify-center pt-4">

            {menuClosed &&
              <Link href={ROUTE_PAGE_DATASETS}>
                <a className="btn-primary w-full ml-6 mr-4 shadow-primary-600 shadow-sm text-center font-light rounded-full text-2xl">+</a>
              </Link>
            }

            {!menuClosed && (
              <Link href={ROUTE_PAGE_DATASETS_NEW}>
                <a className="btn-primary w-full ml-6 mr-4 text-center">New Dataset</a>
              </Link>
            )}

          </div>

          <ul className="py-4">
            <MenuItem href={ROUTE_PAGE_HOME} text="Home">
              <PiechartIcon />
            </MenuItem>
            <MenuItem href={ROUTE_PAGE_DATASETS} text="Datasets">
              <DatasetIcon />
            </MenuItem>
          </ul>
          <hr className="mb-4" />
          <MenuItem href={ROUTE_PAGE_PROFILE} text="Profile">
            <AvatarIcon />
          </MenuItem>
        </aside>
        <div
          className={`flex flex-col justify-center w-full  ${menuClosed
            ? "transition-all duration-500 ease-out ml-16"
            : "transition-all duration-500 ease-out ml-64"
            }`}
        >
          <div
            className="flex justify-end items-center w-full h-16 pr-6 border-b border-b-primary-200 sticky top-0
          backdrop-blur-md bg-primary-50/90 z-40"
          >
            <AvatarButton />
          </div>
          <div
            className={`flex justify-center w-full ${props.noPadding ? "" : "px-8 pt-8"
              } `}
          >
            {props.children}
          </div>
        </div>
      </main>
    </>
  );
};

function MenuItem(props) {
  const router = useRouter();

  function active(href: string) {
    const browserPath = router.pathname.split("/").join("/");
    return href.indexOf(browserPath) >= 0;
  }

  return (
    <li
      className={` ${active(props.href)
        ? "border-r-4 border-r-primary-800 bg-primary-200 font-bold text-primary-900"
        : ""
        } flex items-center pointer-events-auto hover:bg-primary-100 h-11`}
    >
      <Link href={props.href}>
        <a
          className={`flex items-center mx-2 h-full w-full pl-6 group`}
        >
          {props.children}
          <span className="ml-3">{props.text}</span>
        </a>
      </Link>
    </li>
  );
}
