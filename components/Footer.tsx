import Link from "next/link";
import React from "react";
import { Props } from "../components/types/BaseInterfaces";

export interface FooterProps extends Props {
  marginTop?: boolean;
}

export function Footer(props: FooterProps) {
  return (
    <footer
      className={`bg-secondary-900 h-[50vh] ${props.marginTop ?? "mt-12"} `}
    >
      <div className="container mx-auto pt-24">
        <div className="grid grid-rows-1 grid-flow-col gap-4">
          <div className="row-span-2">
            <Link href="/">
              <a>
                <img src="/img/logo.svg" alt="DataMap" className="px-6 w-60 " />
              </a>
            </Link>
            <p className="px-12 py-8">
              Have an account?{" "}
              <Link
                href={{
                  pathname: "/account/login",
                  query: { phase: "sign-in" },
                }}
              >
                Sign in.
              </Link>
            </p>
          </div>
          <div className=" row-span-2">
            <h2 className="font-light">Project</h2>
            <ul>
              <li>
                <Link href="/project/about">
                  <a href="#">About</a>
                </Link>
              </li>
              <li>
                <Link href="/project/faqs">
                  <a href="#">FAQs</a>
                </Link>
              </li>
              <li>
                <Link href="/project/support">
                  <a href="#">Support</a>
                </Link>
              </li>
              <li>
                <Link href="/project/tutorials">
                  <a href="#">Tutorials</a>
                </Link>
              </li>
              <li>
                <Link href="/project/privacy-policy">
                  <a href="#">Privacy Policy</a>
                </Link>
              </li>
            </ul>
          </div>
          <div className=" row-span-2">
            <h2 className="font-light">Tools</h2>
            <ul className="px-2 py-4">
              <li>
                <Link href="/search">
                  <a href="#">Search</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-center p-12">
          © {new Date().getFullYear()} Data Map Platform
        </p>
      </div>
    </footer>
  );
}
