import Layout from "../components/Layout";
import Link from "next/link";

function TextDecorationBolder(props) {
  return (
    <span
      className={`underline decoration-secondary-900 decoration-8 underline-offset-0 ${props.className}`}
    >
      {props.children}
    </span>
  );
}

function SearchCategory(props) {
  return (
    <Link href="/search">
      <div className="bg-secondary-300 rounded-xl h-48 relative group cursor-pointer">
        <div className=" grid grid-cols-1 gap-4 place-items-center h-full bg-secondary-400 rounded-xl transition ease-in delay-150 duration-300 opacity-0 group-hover:opacity-100 border-2 border-secondary-900">
          <div>
            <p className="text-lg text-center">
              “Tailwind CSS is the only framework that I've seen scale on large
              teams. It's easy to customize, adapts to any design, and the build
              size is tiny.”
            </p>
          </div>
        </div>
        <button className="text-lg font-normal w-full h-full p-8 border-secondary-300 bg-secondary-300 rounded-xl absolute inset-0 transition ease-out delay-150 group-hover:opacity-0">
          {props.children}
        </button>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <Layout fluid={true}>
      <div className="special-background">
        <div className="container mx-auto flex flex-row flex-wrap pt-56 pb-24">
          <div className="w-full">
            <h1 className="font-bold text-8xl text-center pb-8">
              <TextDecorationBolder>PoliData.</TextDecorationBolder>
            </h1>

            <h1 className="font-normal text-7xl text-center pb-8">
              Analise de dados científicos, para todos.
              <br />
            </h1>
          </div>
          {/* <div className="py-12 px-8 md:basis-7/12 bg-primary-50 drop-shadow-2xl">
            <h1 className="md:display-2 sm:display-4 font-medium">
              Precisando analisar dados científicos? Use o&nbsp;
              <TextDecorationBolder>PoliData.</TextDecorationBolder>
            </h1>
          </div>*/}
        </div>
        <div className="py-12 bg-gradient-to-t from-primary-50 h-40"></div>
      </div>
      <div className="container mx-auto px-8">
        <section className="mb-40">
          <p className="display-4 text-center">
            No PoliData você pode encontrar diversos dataset de diversas fontes
            de dados do Brasil e do Mundo.
          </p>
        </section>
        <section className="mb-40">
          <h1 className="py-8">
            <TextDecorationBolder className="font-normal">
              Data Search
            </TextDecorationBolder>
          </h1>

          <p className="text-xl">
            Busque por categorias disponíveis ou faça uma busca avançada em
            nossa ferramenta de Data Search.
          </p>

          <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-4 py-4">
            <SearchCategory>Aerosols</SearchCategory>
            <SearchCategory>Atmospheric State</SearchCategory>
            <SearchCategory>Cloud Properties</SearchCategory>
            <SearchCategory>Radiometric</SearchCategory>
            <SearchCategory>Surface Properties</SearchCategory>
            <SearchCategory>Subsoil and groundwater properties</SearchCategory>
          </div>
        </section>
      </div>
    </Layout>
  );
}
