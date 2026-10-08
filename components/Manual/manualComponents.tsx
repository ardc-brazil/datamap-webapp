import Link from "next/link";
import React from "react";
import { slugify } from "../../lib/manualSearch";
import { Captura } from "./Captura";
import { FluxoEnvio } from "./FluxoEnvio";
import { Limites } from "./Limites";
import { Nota } from "./Nota";

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join("");
  }
  if (React.isValidElement(node)) {
    return textOf((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

function Secao(props: React.ComponentProps<"h2">) {
  return (
    <h2 id={slugify(textOf(props.children))} className="mt-12 mb-4 scroll-mt-20 text-2xl font-semibold tracking-[-0.02em]">
      {props.children}
    </h2>
  );
}

function Ligacao(props: React.ComponentProps<"a">) {
  const href = props.href ?? "";
  return href.startsWith("/") ? (
    <Link href={href} className="font-medium text-primary-900 underline underline-offset-2">{props.children}</Link>
  ) : (
    <a {...props} className="font-medium text-primary-900 underline underline-offset-2" />
  );
}

export const manualComponents = {
  h2: Secao,
  a: Ligacao,
  Captura,
  FluxoEnvio,
  Limites,
  Nota,
};
