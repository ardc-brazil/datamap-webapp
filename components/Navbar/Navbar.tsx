import Link from "next/link";
import { ROUTE_PAGE_DATASETS } from "../../contants/InternalRoutesConstants";
import { Logo } from "../Brand/Logo";
import { ActionItemsNavBar } from "./ActionItemsNavBar";
import { HiddenNav, MobileMenuItem as MobileNavbarItem } from "./MobileNavbar";

interface Props {
  children?: React.ReactNode;
  href: string;
  id: string;
}

function NavbarItem(props: Props) {
  return (
    <Link href={props.href} id={props.id} className="text-sm font-medium text-primary-700 hover:text-primary-900">
      {props.children}
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="border-b border-primary-200 sticky top-0 z-40">
      <div className="mx-auto w-full px-4 md:px-8 backdrop-blur-md bg-primary-50/90">
        <div className="flex items-center h-16">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-7 ml-14">
            <NavbarItem href={ROUTE_PAGE_DATASETS} id="navbarItemDatasets">Datasets</NavbarItem>
            <NavbarItem href="/project/about" id="navbarItemAbout">About</NavbarItem>
            <NavbarItem href="/project/data-policy" id="navbarItemDataPolicy">Data policy</NavbarItem>
            <NavbarItem href="/project/support" id="navbarItemSupport">Support</NavbarItem>
          </nav>

          <HiddenNav items={["Search", "Tools", "Support"]}>
            <MobileNavbarItem id="mobileNavbarItemDatasets" href={ROUTE_PAGE_DATASETS}>
              Datasets
            </MobileNavbarItem>
            <MobileNavbarItem id="mobileNavbarItemAbout" href="/project/about">
              About
            </MobileNavbarItem>
            <MobileNavbarItem id="mobileNavbarItemSupport" href="/project/support">
              Support
            </MobileNavbarItem>
            <MobileNavbarItem id="mobileNavbarItemSign" href="/account/login">
              Sign in
            </MobileNavbarItem>
          </HiddenNav>

          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            <ActionItemsNavBar />
          </div>
        </div>
      </div>
    </header>
  );
}
