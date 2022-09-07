import Link from "next/link";
import { HiddenNav, MobileMenuItem as MobileNavbarItem } from "./MobileNavbar";

interface Props {
  children?: React.ReactNode;
  href: string;
  id: string;
}

function NavbarItem(props: Props) {
  return (
    <Link href={props.href}>
      <a id={props.id} className="px-2 py-4">{props.children}</a>
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="border-b border-primary-200 sticky top-0 z-50">
      <div className="mx-auto w-full px-2 backdrop-blur-md bg-primary-50/90">
        <div className="flex items-center py-1 h-16">
          <Link href="/">
            <a className="px-2 py-4">
              <img src="/img/logo.svg" alt="PoliData" />
            </a>
          </Link>

          <nav className="hidden md:flex flex-row ml-10">
            <NavbarItem id="navbarItemSearch" href="/search">
              Data Search
            </NavbarItem>
            <NavbarItem id="navbarItemTools" href="/tools">
              Data Tools
            </NavbarItem>
            <NavbarItem id="navbarItemProject" href="/project">
              Project
            </NavbarItem>
          </nav>

          <HiddenNav items={["Data Search", "Data Tools", "Support"]}>
            <MobileNavbarItem id="mobileNavbarItemSearch" href="/search">
              Data Search
            </MobileNavbarItem>
            <MobileNavbarItem id="mobileNavbarItemTools" href="/tools">
              Data Tools
            </MobileNavbarItem>
            <MobileNavbarItem id="mobileNavbarItemProject" href="/project">
              Project
            </MobileNavbarItem>
          </HiddenNav>

          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            {/* <a href="" className="btn-primary-outline mx-2">Sign in</a> */}
            <button className="btn-primary-outline mx-2">Sign in</button>
            {/* <a href="#">Sign up</a> */}
            <button className="btn-primary">Sign up</button>
          </div>
        </div>
      </div>
    </header>
  );
}
