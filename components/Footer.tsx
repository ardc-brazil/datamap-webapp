import Link from "next/link";
import { Props } from "../components/types/BaseInterfaces";
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_NOTEBOOKS } from "../contants/InternalRoutesConstants";
import { Logo } from "./Brand/Logo";

export interface FooterProps extends Props {
  marginTop?: boolean;
}

export function Footer(props: FooterProps) {
  return (
    <footer
      className={`bg-primary-900 text-primary-50 h-fit ${props.marginTop ?? "mt-12"} `}
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8 px-8 pt-16 pb-10">
          <div className="flex flex-col gap-5">
            <Link href="/" className="self-start">
              <Logo inverse />
            </Link>
            <p className="m-0 max-w-sm text-sm leading-[22px] text-primary-400">
              A data platform for atmospheric big data and data science research in Brazil. Escola Politécnica, University of São Paulo.
            </p>
          </div>
          <FooterColumn title="Project">
            <FooterLink href="/project/about">About</FooterLink>
            <FooterLink href="/project/support">Support</FooterLink>
            <FooterLink href="/project/data-policy">Data Policy</FooterLink>
            <FooterLink href="/project/research-group">Research Group</FooterLink>
            <FooterLink href="/project/partners-and-supporters">Partners and Supporters</FooterLink>
          </FooterColumn>
          <FooterColumn title="Tools">
            <FooterLink href={ROUTE_PAGE_DATASETS}>Datasets</FooterLink>
            <FooterLink href={ROUTE_PAGE_NOTEBOOKS}>Notebooks</FooterLink>
            <FooterLink
              href={{
                pathname: "/account/login",
                query: { phase: "sign-in", tenancy: "datamap/production/data-amazon" },
              }}
            >
              Sign in
            </FooterLink>
          </FooterColumn>
        </div>
        <div className="mx-8 h-px bg-primary-800" />
        <div className="p-8 flex flex-row flex-wrap gap-7 justify-center items-center">
          <a href="https://www.usp.br/" target="_blank">
            <img className="grayscale invert brightness-150 opacity-70 hover:opacity-100 transition-opacity inline-block w-24 self-center" src="/img/partners-supporters/usp-logo.png" alt="University of São Paulo (USP)" />
          </a>
          <a href="https://www.gov.br/inpe" target="_blank">
            <img className="grayscale invert brightness-150 opacity-70 hover:opacity-100 transition-opacity inline-block w-16 self-center" src="/img/partners-supporters/inpe-logo.png" alt="National Institute for Space Research (INPE)" />
          </a>
          <a href="https://www.unicamp.br/" target="_blank">
            <img className="grayscale invert brightness-150 opacity-70 hover:opacity-100 transition-opacity inline-block w-12 self-center" src="/img/partners-supporters/unicamp-logo.svg" alt="University of Campinas (Unicamp)" />
          </a>
          <a href="https://datacite.org/" target="_blank">
            <img className="grayscale invert brightness-150 opacity-70 hover:opacity-100 transition-opacity inline-block w-32 self-center" src="/img/partners-supporters/datacite-logo.png" alt="DataCite" />
          </a>
          <a href="https://www.shell.com.br/" target="_blank">
            <img className="grayscale invert brightness-150 opacity-70 hover:opacity-100 transition-opacity inline-block w-7 self-center" src="/img/partners-supporters/shell-logo.png" alt="Shell" />
          </a>
          <a href="https://fapesp.br/" target="_blank">
            <img className="grayscale invert brightness-150 opacity-70 hover:opacity-100 transition-opacity inline-block w-24 h-fit self-center" src="/img/partners-supporters/fapesp-logo.png" alt="São Paulo Research Foundation (Fapesp)" />
          </a>
          <a href="https://www.arm.gov/" target="_blank">
            <img className="grayscale invert brightness-150 opacity-70 hover:opacity-100 transition-opacity inline-block w-24 self-center" src="/img/partners-supporters/arm-logo.png" alt="Atmospheric Radiation Measurement (ARM)" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-500">{props.title}</span>
      <ul className="flex flex-col gap-2.5">{props.children}</ul>
    </div>
  );
}

function FooterLink(props: { href: React.ComponentProps<typeof Link>["href"]; children: React.ReactNode }) {
  return (
    <li>
      <Link href={props.href} className="text-sm text-primary-50 hover:text-primary-300">
        {props.children}
      </Link>
    </li>
  );
}
