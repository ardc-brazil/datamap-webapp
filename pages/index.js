import Layout from "../components/Layout";
import Link from "next/link";

function TextDecorationBolder(props) {
  return (
    <span className="underline decoration-secondary-900 decoration-8 underline-offset-0">
      {props.children}
    </span>
  );
}

function BigButton(props) {
  return (
    <Link href="/search">
      <button className="self-center w-full h-full basis-6/12 
      border border-secondary-900">
        {props.children}
      </button>
    </Link>
  );
}

export default function HomePage() {
  return (
    <Layout fluid={true}>
      <div className="special-background bg-fixed">
        <div className="container mx-auto flex flex-row flex-wrap py-20">
          <div className="py-12 px-8 md:basis-6/12 bg-primary-50 drop-shadow-2xl">
            <h1 className="md:display-2 sm:display-4 font-medium">
              Precisando analisar dados científicos? Use o&nbsp;
              <TextDecorationBolder>PoliData.</TextDecorationBolder>
            </h1>
          </div>
        </div>
        <div className="py-12 bg-gradient-to-t from-primary-50 h-40"></div>
      </div>
      <div className="container mx-auto">
        <p className="display-4 my-20 text-center font-bold">
          No PoliAnalytics você pode encontrar diversos dataset de diversas
          fontes de dados do Brasil e do Mundo.
        </p>

        <h1>
          <TextDecorationBolder>Data Search</TextDecorationBolder>
        </h1>

        <p>
          Busque por categorias disponíveis ou faça uma busca avançada em nossa
          ferramenta de Data Search.
        </p>

        <div class="flex gap-4 items-stretch h-64 p-8">
          <BigButton>Aerosols</BigButton>
          <BigButton>Atmospheric State</BigButton>
          <BigButton>Cloud Properties</BigButton>
          <BigButton>Radiometric</BigButton>
          <BigButton>Surface Properties</BigButton>
          <BigButton>Subsoil and groundwater properties</BigButton>
        </div>
      </div>
    </Layout>
  );
}
