import Link from "next/link";

function NavItem(props) {
  return (
    <Link href={props.href}>
      <a className="px-4 py-4">{props.children}</a>
    </Link>
  );
}

export default function Menu() {
  return (
    <header className="border-b border-primary-200 sticky top-0 z-50">
      <div className="mx-auto w-full px-4 bg-primary-50 opacity-[.99]">
        <div className="flex items-center py-1 h-16">
          <div>
            <Link href="/">
              <a>
                <img src="/img/logo.svg" alt="PoliData" />
              </a>
            </Link>
          </div>

          <div className="-mr-2 -my-2 md:hidden">
            <button
              type="button"
              className="bg-white rounded-md p-2 inline-flex items-center justify-center text-slate-900 hover:text-slate-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <nav className="hidden md:flex flex-row ml-10">
            <NavItem href="/search">Data Search</NavItem>
            <NavItem href="/tools">Data Tools</NavItem>
            <NavItem href="/support">Support</NavItem>
          </nav>

          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            <a href="#" className="btn-primary-outline mx-2">
              Sign in
            </a>
            <a href="#" className="btn-primary">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
