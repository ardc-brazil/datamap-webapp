import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_NEW, ROUTE_PAGE_HOME, ROUTE_PAGE_NOTEBOOKS, ROUTE_PAGE_NOTEBOOKS_NEW, ROUTE_PAGE_PROFILE } from "../contants/InternalRoutesConstants";
import Head from "../node_modules/next/head";
import AvatarIcon from "./Icons/AvatarIcon";
import DatasetIcon from "./Icons/DatasetIcon";
import PiechartIcon from "./Icons/PiechartIcon";
import AvatarButton from "./Profile/AvatarButton";
import useComponentVisible from "../hooks/UseComponentVisible";
import NotebookIcon from "./Icons/NotebookIcon";
import HomeIcon from "./Icons/HomeIcon";

interface Props {
  children?: React.ReactNode;
  noPadding?: boolean;
  footerPropsMarginTop?: boolean;
  hideFooter?: boolean;
  className?: string;
}

export default (props: Props) => {
  const [menuClosed, setMenuClosed] = useState(false);
  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  function toggleMenu(): void {
    setMenuClosed(!menuClosed);
  }

  function showCreateMenu(event): void {
    setIsComponentVisible(true);
  }

  return (
    <>
      <Head>
        <title>DataMap</title>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8"></meta>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
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
            <Link href="/" className="w-full pl-4 flex items-start">
              <img src="/img/logo.svg" alt="DataMap" className="h-9" />
            </Link>
          </div>



          <div className="flex items-center justify-center pt-4">

            {menuClosed &&
              <Link href={ROUTE_PAGE_DATASETS} className="btn-primary w-12 h-12 ml-6 mr-4 px-4 py-2 shadow-primary-600 shadow-sm text-center font-light rounded-full text-2xl">
                +
              </Link>
            }

            {!menuClosed && (
              <div className="realtive inline-block w-full ml-6 mr-4">
                <button type="button" className="btn-primary w-full" onClick={showCreateMenu}>
                  Create
                  <div className="relative w-full">
                    <svg className="-mr-1 h-5 w-5 text-gray-400 inline-block absolute -top-5 right-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                <div ref={ref} className={`${!isComponentVisible && "hidden"} absolute right-4 z-10 mt-0 w-52 origin-top-right rounded shadow-lg ring-1 ring-primary-900 ring-opacity-5 focus:outline-none bg-primary-50`} role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
                  <div className="py-1" role="none">
                    <CreateMenuItem href={ROUTE_PAGE_DATASETS_NEW} text="New Dataset" onClick={() => setIsComponentVisible(false)} img="/img/icon-dataset.svg" />
                    <CreateMenuItem href={ROUTE_PAGE_NOTEBOOKS} text="New Notebook" onClick={() => setIsComponentVisible(false)} img="/img/icon-code.svg" />
                  </div>
                </div>
              </div>
            )}

          </div>

          <ul className="py-4">
            <MenuItem href={ROUTE_PAGE_HOME} text="Home">
              <HomeIcon />
            </MenuItem>
            <MenuItem href={ROUTE_PAGE_DATASETS} text="Datasets">
              <DatasetIcon />
            </MenuItem>
            <MenuItem href={ROUTE_PAGE_NOTEBOOKS} text="Notebooks">
              <NotebookIcon />
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

function CreateMenuItem(props) {
  return <Link href={props.href} className="block px-4 py-2 text-sm hover:bg-primary-100" onClick={() => props.onClick()}>
    <img src={props.img} className="w-6 inline-block mr-2" />
    {props.text}
  </Link>;
}

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
      <Link href={props.href} className={`flex items-center mx-2 h-full w-full pl-6 group`}>
        {props.children}
        <span className="ml-3">{props.text}</span>
      </Link>
    </li>
  );
}
