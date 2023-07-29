import Link from "next/link";
import Head from "../node_modules/next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import SearchIcon from "./Icons/SearchIcon";
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
        {/* <div className="fixed right-0 mr-6 mt-2">
          <AvatarButton />
        </div> */}

        <aside
          className={`flex-none w-64 h-screen overflow-auto border-r border-primary-200 ${
            menuClosed
              ? "transition-all duration-500 ease-out w-16"
              : "transition-all duration-500 ease-out w-64"
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
                <path strokeWidth="2" d="M5 8h18M5 13h18M5 18h18" />
              </svg>
            </button>
            <Link href="/">
              <a className="w-full pl-4 flex items-start">
                <img src="/img/logo.svg" alt="DataMap" className="h-9" />
              </a>
            </Link>
          </div>

          <ul className="py-4">
            <MenuItem href="/" text="Home">
              <PiechartIcon className="w-5 h-5 inline-block fill-primary-600" />
            </MenuItem>
            <MenuItem href="/app/datasets" text="Datasets">
              <DatasetIcon className="w-5 h-5 inline-block fill-primary-600" />
            </MenuItem>
            <MenuItem href="/app/search" text="Search">
              <SearchIcon className="w-5 h-5 inline-block fill-primary-600" />
            </MenuItem>
          </ul>
        </aside>
        <div
          className={`flex flex-col justify-center w-full  ${
            menuClosed
              ? "transition-all duration-500 ease-out ml-16"
              : "transition-all duration-500 ease-out ml-64"
          }`}
        >
          <div
            className="flex justify-end items-center w-full h-16 pr-6 border-b border-b-primary-200 sticky top-0
          backdrop-blur-md bg-primary-50/90 z-50"
          >
            <AvatarButton />
          </div>
          <div
            className={`flex justify-center w-full ${
              props.noPadding ? "" : "px-8 pt-8"
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
    var pathName = router.pathname.split("/");
    return "/" + pathName[1] == href;
  }

  return (
    <li
      className={` ${
        active(props.href)
          ? "border-r-2 border-r-primary-800 bg-primary-100"
          : ""
      } flex items-center pointer-events-auto hover:bg-primary-100 h-11`}
    >
      <Link href={props.href}>
        <a
          className={`flex items-center mx-2 h-full w-full pl-6 group text-primary-700 font-normal`}
        >
          {props.children}
          <span className="ml-3">{props.text}</span>
        </a>
      </Link>
    </li>
  );
}
