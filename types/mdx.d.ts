declare module "*.mdx" {
  import { ComponentType } from "react";

  const Conteudo: ComponentType<{ components?: Record<string, unknown> }>;
  export default Conteudo;
}
