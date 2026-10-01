import Link from "next/link";
import Layout from "../components/Layout";
import { ROUTE_PAGE_SEARCH } from "../contants/InternalRoutesConstants";

const CATEGORIES = [
  "Aerosols",
  "Atmospheric State",
  "Cloud Properties",
  "Radiometric",
  "Surface Properties",
  "Subsoil and groundwater properties",
  "Renewable Energy",
];

function SearchCategory(props) {
  return (
    <Link
      href={ROUTE_PAGE_SEARCH}
      className={`flex items-end min-h-[7.5rem] p-5 rounded-lg text-[17px] leading-6 font-medium text-primary-900 hover:text-primary-900 transition-colors ${props.highlight
        ? "bg-secondary-500 hover:bg-secondary-900"
        : "bg-primary-0 border border-primary-200 hover:border-primary-400"
        }`}
    >
      {props.children}
    </Link>
  );
}

function FeatureSection(props) {
  return (
    <section className="py-20 md:py-[7.5rem] flex flex-col gap-12">
      <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-6 md:gap-16 items-start">
        <h2 className="m-0 text-3xl md:text-[40px] leading-[1.1] font-semibold tracking-[-0.025em]">
          {props.title}
        </h2>
        <p className="m-0 text-lg leading-[29px] text-primary-700">{props.children}</p>
      </div>
      {props.extra}
    </section>
  );
}

export default function HomePage(props) {
  return (
    <Layout fluid={true}>
      <div className="flex flex-col items-center text-center gap-7 px-8 pt-28 md:pt-40 pb-24">
        <img src="/img/brand/datamap-mark.svg" alt="DataMap" className="w-24 h-24 md:w-[7.5rem] md:h-[7.5rem]" />
        <h1 className="m-0 max-w-[900px] text-5xl md:text-7xl leading-[1.05] font-semibold tracking-[-0.03em]">
          Scientific data analysis, for everyone.
        </h1>
        <p className="m-0 max-w-[680px] text-xl md:text-[22px] leading-8 text-primary-700">
          Find, catalog and analyse environmental datasets from Brazil and the
          world — versioned, citable and open to your research group.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Link href={ROUTE_PAGE_SEARCH} className="btn-primary text-[15px] px-5 py-3 m-0 hover:text-primary-50">
            Browse datasets
          </Link>
          <Link
            href={{
              pathname: "/account/login",
              query: { phase: "sign-in", tenancy: "datamap/production/data-amazon" },
            }}
            className="btn-primary-outline text-[15px] px-5 py-3 m-0"
          >
            Sign in with ORCID
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-8">
        <div className="h-px bg-primary-200" />
        <FeatureSection title="Catalog datasets">
          A centralized hub where researchers catalog and organize datasets
          from research projects and campaigns. Upload, label and categorize
          your data, with versions and a DOI for each release.
        </FeatureSection>
        <div className="h-px bg-primary-200" />
        <FeatureSection
          title="Powerful search"
          extra={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CATEGORIES.map((category) => (
                <SearchCategory key={category}>{category}</SearchCategory>
              ))}
              <SearchCategory highlight>All datasets →</SearchCategory>
            </div>
          }
        >
          Navigate the repository with filters, metadata tags and keywords.
          Search by category, measurement, datastream, site or source — or
          start from one of the categories below.
        </FeatureSection>
        <div className="h-px bg-primary-200" />
        <FeatureSection title="Process and analyse">
          Open any dataset in a Jupyter notebook without downloading files or
          switching applications, and work with the data where it lives.
        </FeatureSection>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  const researchers = require("/public/data/researchers.json");

  return {
    props: {
      researchers,
    },
  }
}