import { MouseEventHandler, useState } from "react";

interface Props {
  children?: React.ReactNode;
  href: string;
  clicked?: MouseEventHandler<HTMLElement>;
  id: string;
}

export function MobileMenuItem(props: Props) {
  return (
    <li>
      <a
        id={props.id}
        href={props.href}
        className="block py-2 pr-4 pl-3 rounded hover:bg-gray-100 md:hover:bg-transparent"
        onClick={props.clicked}
      >
        {props.children}
      </a>
    </li>
  );
}

export function HiddenNav(props) {
  const [isActive, setActive] = useState(false);
  const toggleClass = () => {
    setActive(!isActive);
  };

  return (
    <div className="md:hidden flex flex-row justify-end flex-1 w-0">
      <button
        data-collapse-toggle="navbar-default"
        type="button"
        className="md:hidden inline-flex items-center p-2 ml-3 text-sm text-primary-900 rounded  hover:bg-primary-50 focus:outline-none focus:ring-primary-900 active:bg-primary-50"
        aria-controls="navbar-default"
        aria-expanded="false"
        onClick={toggleClass}
      >
        <span className="sr-only">Open main menu</span>
        <svg
          className="w-6 h-6"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>

      <div
        className={`${
          isActive ? null : "hidden"
        } md:hidden ml-8 border-b border-t border-primary-200 z-40 fixed top-16 w-full bg-primary-50 opacity-[.99]`}
      >
        <ul className="flex flex-col p-4 ml-4">{props.children}</ul>
      </div>
    </div>
  );
}
