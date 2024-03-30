import Link from "next/link";
import { Props } from "../components/types/BaseInterfaces";
import { ROUTE_PAGE_DATASETS } from "../contants/InternalRoutesConstants";

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
              <img src="/img/logo.svg" alt="DataMap" className="px-6 w-60 " />
            </Link>
            <p className="px-12 py-8">
              Have an account?{" "}
              <Link
                href={{
                  pathname: "/account/login",
                  query: { phase: "sign-in", tenancy: "datamap/production/data-amazon" },
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
                  About
                </Link>
              </li>
              <li>
                <Link href="/project/faqs">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/project/support">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/project/tutorials">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="/project/privacy-policy">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div className=" row-span-2">
            <h2 className="font-light">Tools</h2>
            <ul className="px-2 py-4">
              <li>
                <Link href={ROUTE_PAGE_DATASETS}>
                  Datasets
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
