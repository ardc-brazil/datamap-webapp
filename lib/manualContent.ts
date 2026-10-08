import dynamic from "next/dynamic";
import { ComponentType } from "react";

type Conteudo = ComponentType<{ components?: Record<string, unknown> }>;

export const MANUAL_CONTENT: Record<string, Conteudo> = {
  "01-primeiros-passos": dynamic(() => import("../content/manual/01-primeiros-passos.mdx")),
  "02-sua-conta": dynamic(() => import("../content/manual/02-sua-conta.mdx")),
  "03-workspaces": dynamic(() => import("../content/manual/03-workspaces.mdx")),
  "04-encontrar-datasets": dynamic(() => import("../content/manual/04-encontrar-datasets.mdx")),
  "05-criar-dataset-e-versoes": dynamic(() => import("../content/manual/05-criar-dataset-e-versoes.mdx")),
  "06-envio-e-download-de-arquivos": dynamic(() => import("../content/manual/06-envio-e-download-de-arquivos.mdx")),
  "07-citacao-e-doi": dynamic(() => import("../content/manual/07-citacao-e-doi.mdx")),
  "08-embargo": dynamic(() => import("../content/manual/08-embargo.mdx")),
  "09-compartilhamento": dynamic(() => import("../content/manual/09-compartilhamento.mdx")),
  "10-links-anonimos-para-revisores": dynamic(() => import("../content/manual/10-links-anonimos-para-revisores.mdx")),
  "11-para-administradores": dynamic(() => import("../content/manual/11-para-administradores.mdx")),
  "12-limites-e-referencia-rapida": dynamic(() => import("../content/manual/12-limites-e-referencia-rapida.mdx")),
};
