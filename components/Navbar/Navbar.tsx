import Link from "next/link";
import { HiddenNav, MobileMenuItem as MobileNavbarItem } from "./MobileNavbar";
import { ActionItemsNavBar } from "./ActionItemsNavBar";

interface Props {
  children?: React.ReactNode;
  href: string;
  id: string;
}

function NavbarItem(props: Props) {
  return (
    <Link href={props.href} id={props.id} className="px-2 py-4">
      {props.children}
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="border-b border-primary-200 sticky top-0 z-40">
      <div className="mx-auto w-full px-2 backdrop-blur-md bg-primary-50/90">
        <div className="flex items-center py-1 h-16">
          <Link href="/" className="pl-6 py-4">
            <img src="/img/logo.svg" alt="DataMap" className=" h-9" />
          </Link>

          <nav className="hidden md:flex flex-row ml-10">
            {/* <NavbarItem id="navbarItemSearch" href={ROUTE_PAGE_SEARCH}>
              Search
            </NavbarItem> */}
            {/* <NavbarItem id="navbarItemTools" href="/tools">
              Tools
            </NavbarItem>
            <NavbarItem id="navbarItemProject" href="/project">
              Project
            </NavbarItem> */}
          </nav>

          <HiddenNav items={["Search", "Tools", "Support"]}>
            {/* <MobileNavbarItem id="mobileNavbarItemSearch" href={ROUTE_PAGE_SEARCH}>
              Search
            </MobileNavbarItem> */}
            {/* <MobileNavbarItem id="mobileNavbarItemTools" href="/tools">
              Tools
            </MobileNavbarItem>
            <MobileNavbarItem id="mobileNavbarItemProject" href="/project">
              Project
            </MobileNavbarItem> */}
          </HiddenNav>

          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            <ActionItemsNavBar />
          </div>
        </div>
      </div>
    </header>
  );
}
