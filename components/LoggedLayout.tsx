import Link from "next/link";
import Router, { useRouter } from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_NEW, ROUTE_PAGE_HOME, ROUTE_PAGE_NOTEBOOKS, ROUTE_PAGE_PROFILE, ROUTE_PAGE_TENANCY_SELECTOR } from "../contants/InternalRoutesConstants";
import useComponentVisible from "../hooks/UseComponentVisible";
import Head from "../node_modules/next/head";
import { MaterialSymbol } from "react-material-symbols";
import { Logo } from "./Brand/Logo";
import AvatarButton from "./Profile/AvatarButton";
import { useTenancyStore } from "./TenancyStore";

interface Props {
  children?: React.ReactNode;
  noPadding?: boolean;
  footerPropsMarginTop?: boolean;
  hideFooter?: boolean;
  className?: string;
}

export default function LoggedLayour(props: Props) {
  const [menuClosed, setMenuClosed] = useState(false);
  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
  const isTenancySelected = useTenancyStore((state) => state.isTenancySelected)
  const tenancySelected = useTenancyStore((state) => state.tenancySelected)

  function toggleMenu(): void {
    setMenuClosed(!menuClosed);
  }

  function showCreateMenu(event): void {
    setIsComponentVisible(true);
  }

  // If no tenancy selected, request to select one
  if (!isTenancySelected()) {
    Router.replace(ROUTE_PAGE_TENANCY_SELECTOR);
  }

  return (
    <>
      <Head>
        <title>DataMap</title>
        <meta charSet="utf-8"></meta>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
      </Head>

      <main className="flex flex-nowrap flex-row">
        <aside
          className={`flex flex-col flex-none h-screen overflow-auto border-r border-primary-200 bg-primary-50 ${menuClosed
            ? "transition-all duration-300 ease-out w-16"
            : "transition-all duration-300 ease-out w-64"
            } fixed`}
        >
          <div className={`flex items-center h-16 flex-none ${menuClosed ? "justify-center" : "justify-between pl-5 pr-3"}`}>
            {!menuClosed && (
              <Link href="/" className="flex items-center">
                <Logo size="md" />
              </Link>
            )}
            <button
              className="p-2 rounded-md text-primary-500 hover:bg-primary-100 hover:text-primary-900"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>

          <div className={`flex items-center pt-2 ${menuClosed ? "justify-center" : "px-4"}`}>

            {menuClosed &&
              <Link href={ROUTE_PAGE_DATASETS} className="flex items-center justify-center w-10 h-10 rounded-md bg-primary-900 text-primary-50 text-xl hover:bg-primary-800 hover:text-primary-50" aria-label="Create">
                +
              </Link>
            }

            {!menuClosed && (
              <div className="relative inline-block w-full">
                <button type="button" className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-md bg-primary-900 text-primary-50 text-sm font-semibold hover:bg-primary-800" onClick={showCreateMenu}>
                  Create
                  <svg className="h-4 w-4 text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                <div ref={ref} className={`${!isComponentVisible && "hidden"} absolute left-0 right-0 z-10 mt-1 origin-top rounded-md border border-primary-200 shadow-lg focus:outline-none bg-primary-0`} role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
                  <div className="py-1" role="none">
                    <CreateMenuItem href={ROUTE_PAGE_DATASETS_NEW} text="New Dataset" onClick={() => setIsComponentVisible(false)} icon="database" />
                    <CreateMenuItem href={ROUTE_PAGE_NOTEBOOKS} text="New Notebook" onClick={() => setIsComponentVisible(false)} icon="code" />
                  </div>
                </div>
              </div>
            )}

          </div>

          <ul className="flex flex-col gap-0.5 px-2 py-4">
            <MenuItem href={ROUTE_PAGE_HOME} text="Home" icon="home" collapsed={menuClosed} />
            <MenuItem href={ROUTE_PAGE_DATASETS} text="Datasets" icon="database" collapsed={menuClosed} />
            <MenuItem href={ROUTE_PAGE_NOTEBOOKS} text="Notebooks" icon="code" collapsed={menuClosed} />
          </ul>
          <hr className="mx-2 border-primary-200" />
          <ul className="p-2">
            <MenuItem href={ROUTE_PAGE_PROFILE} text="Profile" icon="person" collapsed={menuClosed} />
          </ul>
          {!menuClosed && tenancySelected && (
            <div className="mt-auto px-5 py-4 text-[11px] leading-4 tracking-[0.02em] text-primary-400">
              {tenancySelected.split("/").join(" / ")}
            </div>
          )}
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
            className={`flex justify-center w-full ${props.noPadding ? "" : "px-8 pt-8 pb-24"
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
  return <Link href={props.href} className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 hover:text-primary-900" onClick={() => props.onClick()}>
    <MaterialSymbol icon={props.icon} size={20} weight={400} grade={-25} className="text-primary-500" />
    {props.text}
  </Link>;
}

function MenuItem(props) {
  const router = useRouter();

  function active(href: string) {
    const browserPath = router.pathname.split("/").join("/");
    return href.indexOf(browserPath) >= 0;
  }

  const isActive = active(props.href);

  return (
    <li>
      <Link
        href={props.href}
        title={props.collapsed ? props.text : undefined}
        className={`flex items-center gap-3 h-10 rounded-md text-sm ${props.collapsed ? "justify-center" : "px-3"} ${isActive
          ? "bg-secondary-500 font-semibold text-primary-900"
          : "font-medium text-primary-700 hover:bg-primary-100"
          }`}
      >
        <MaterialSymbol icon={props.icon} size={20} weight={400} grade={-25} fill={isActive} className={isActive ? "text-primary-900" : "text-primary-500"} />
        {!props.collapsed && <span>{props.text}</span>}
      </Link>
    </li>
  );
}
