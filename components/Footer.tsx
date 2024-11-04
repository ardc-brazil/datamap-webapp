import Link from "next/link";
import { Props } from "../components/types/BaseInterfaces";
import { ROUTE_PAGE_DATASETS } from "../contants/InternalRoutesConstants";

export interface FooterProps extends Props {
  marginTop?: boolean;
}

export function Footer(props: FooterProps) {
  return (
    <footer
      className={`bg-secondary-900 h-fit ${props.marginTop ?? "mt-12"} `}
    >
      <div className="container mx-auto pt-24">
        <div className="grid grid-rows-1 md:grid-flow-col px-8 gap-4">
          <div className="row-span-2">
            <Link href="/">
              <img src="/img/logo.svg" alt="DataMap" className="md:px-6 w-60 " />
            </Link>
            <p className="md:px-12 py-8">
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
                <Link href="/project/support">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/project/data-policy">
                  Data Policy
                </Link>
              </li>
              <li>
                <Link href="/project/research-group">
                  Research Group
                </Link>
              </li>
              <li>
                <Link href="/project/partners-and-supporters">
                  Partners and Supporters
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
        <div className="p-12 flex flex-row gap-4 justify-center">
          <a href="https://www.usp.br/" target="_blank">
            <img className="grayscale hover:grayscale-0 inline-block w-24 self-center" src="/img/partners-supporters/usp-logo.png" alt="University of São Paulo (USP)" />
          </a>
          <a href="https://www.gov.br/inpe" target="_blank">
            <img className="grayscale hover:grayscale-0 inline-block w-16 self-center" src="/img/partners-supporters/inpe-logo.png" alt="National Institute for Space Research (INPE)" />
          </a>
          <a href="https://www.unicamp.br/" target="_blank">
            <img className="grayscale hover:grayscale-0 inline-block w-12 self-center" src="/img/partners-supporters/unicamp-logo.svg" alt="University of Campinas (Unicamp)" />
          </a>
          <a href="https://datacite.org/" target="_blank">
            <img className="grayscale hover:grayscale-0 inline-block w-32 self-center" src="/img/partners-supporters/datacite-logo.png" alt="DataCite" />
          </a>
          <a href="https://www.shell.com.br/" target="_blank">
            <img className="grayscale hover:grayscale-0 inline-block w-7 self-center" src="/img/partners-supporters/shell-logo.png" alt="Shell" />
          </a>
          <a href="https://fapesp.br/" target="_blank">
            <img className="grayscale hover:grayscale-0 inline-block w-24 h-fit self-center" src="/img/partners-supporters/fapesp-logo.png" alt="São Paulo Research Foundation (Fapesp)" />
          </a>
          <a href="https://www.arm.gov/" target="_blank">
            <img className="grayscale hover:grayscale-0 inline-block w-24 self-center" src="/img/partners-supporters/arm-logo.png" alt="Atmospheric Radiation Measurement (ARM)" />
          </a>
        </div>
      </div>
    </footer>
  );
}
