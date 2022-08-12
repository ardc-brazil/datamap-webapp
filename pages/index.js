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
    <div className="self-center px-1">
      <Link href="/search">
        <button className="text-lg w-full h-full p-8 border border-secondary-900 bg-secondary-200 rounded-xl">
          {props.children}
        </button>
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <Layout fluid={true}>
      <div className="special-background">
        <div className="container mx-auto flex flex-row flex-wrap py-20">
          <div className="py-12 px-8 md:basis-7/12 bg-primary-50 drop-shadow-2xl">
            <h1 className="md:display-2 sm:display-4 font-medium">
              Precisando analisar dados científicos? Use o&nbsp;
              <TextDecorationBolder>PoliData.</TextDecorationBolder>
            </h1>
          </div>
        </div>
        <div className="py-12 bg-gradient-to-t from-primary-50 h-40"></div>
      </div>
      <div className="container mx-auto">
        <section className="mb-40">
          <p className="display-4 text-center font-bold">
            No PoliAnalytics você pode encontrar diversos dataset de diversas
            fontes de dados do Brasil e do Mundo.
          </p>
        </section>
        <section className="mb-40">
          <h1 className="py-8">
            <TextDecorationBolder>Data Search</TextDecorationBolder>
          </h1>

          <p className="text-xl">
            Busque por categorias disponíveis ou faça uma busca avançada em
            nossa ferramenta de Data Search.
          </p>

          <div className="grid sm:grid-cols-4 grid-cols-1 gap-4 place-content-center py-4">
            <BigButton>Aerosols</BigButton>
            <BigButton>Atmospheric State</BigButton>
            <BigButton>Cloud Properties</BigButton>
            <BigButton>Radiometric</BigButton>
            <BigButton>Surface Properties</BigButton>
            <BigButton>Subsoil and groundwater properties</BigButton>
          </div>
        </section>
      </div>
    </Layout>
  );
}
