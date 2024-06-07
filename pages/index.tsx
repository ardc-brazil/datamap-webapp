import Link from "next/link";
import Layout from "../components/Layout";
import { ROUTE_PAGE_SEARCH } from "../contants/InternalRoutesConstants";

function TextDecorationBolder(props) {
  return (
    <span
      className={`underline decoration-secondary-900 decoration-8 underline-offset-4 ${props.className}`}
    >
      {props.children}
    </span>
  );
}

function SearchCategory(props) {
  return (
    <Link href={ROUTE_PAGE_SEARCH}>
      <div className="bg-secondary-300 rounded-xl h-48 relative group cursor-pointer">
        <div className=" grid grid-cols-1 gap-4 place-items-center h-full bg-secondary-400 rounded-xl transition ease-in delay-150 duration-300 opacity-0 group-hover:opacity-100 border-2 border-secondary-900">
          <div>
            <p className="text-lg text-center">{props.children}</p>
          </div>
        </div>
        <button className="text-lg font-normal w-full h-full p-8 border-secondary-300 bg-secondary-300 rounded-xl absolute inset-0 transition ease-out delay-150 group-hover:opacity-0">
          {props.children}
        </button>
      </div>
    </Link>
  );
}

export default function HomePage(props) {
  return (
    <Layout fluid={true}>
      <div className="special-background">
        <div className="container mx-auto flex flex-row flex-wrap pt-56 pb-24">
          <div className="w-full">
            <h1 className="font-bold text-8xl text-center pb-8">
              <TextDecorationBolder>DataMap</TextDecorationBolder>
            </h1>

            <h1 className="font-normal text-7xl text-center pb-8">
              Scientific data analysis, for everyone.
              <br />
            </h1>
          </div>
          {/* <div className="py-12 px-8 md:basis-7/12 bg-primary-50 drop-shadow-2xl">
            <h1 className="md:display-2 sm:display-4 font-medium">
              Precisando analisar dados científicos? Use o&nbsp;
              <TextDecorationBolder>DataMap.</TextDecorationBolder>
            </h1>
          </div>*/}
        </div>
        <div className="py-12 bg-gradient-to-t from-primary-50 h-40"></div>
      </div>
      <div className="container mx-auto px-8">
        <section className="mb-40">
          <p className="display-4 text-center">
            With DataMap you can find environmental datasets from diverse
            sources of data from Brazil and the World.
          </p>
        </section>
        <section className="mb-40">
          <h1 className="py-8">
            <TextDecorationBolder className="font-normal">
              Catalog Datasets
            </TextDecorationBolder>
          </h1>

          <p className="text-xl">
            Our platform provides a centralized hub where researchers can easily
            catalog and organize all their datasets related to various research
            projects and campaigns. With intuitive and user-friendly tools, you
            can effortlessly upload, label, and categorize your datasets,
            ensuring quick access and efficient data management.
          </p>
        </section>

        <section className="mb-40">
          <h1 className="py-8">
            <TextDecorationBolder className="font-normal">
              Powerful Search
            </TextDecorationBolder>
          </h1>

          <p className="text-xl">
            We understand that the ability to find and understand your cataloged
            datasets is crucial for your research success. That's why our
            platform boasts a robust and highly flexible search service.
            Seamlessly navigate through your data repository using advanced
            search filters, metadata tags, and custom keywords. Discover hidden
            correlations, uncover insights, and retrieve specific datasets with
            unparalleled ease.
          </p>
          <p>
            Search foravailable categories or do an advanced search in our tool.
          </p>

          <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-4 py-4">
            <SearchCategory>Aerosols</SearchCategory>
            <SearchCategory>Atmospheric State</SearchCategory>
            <SearchCategory>Cloud Properties</SearchCategory>
            <SearchCategory>Radiometric</SearchCategory>
            <SearchCategory>Surface Properties</SearchCategory>
            <SearchCategory>Subsoil and groundwater properties</SearchCategory>
            <SearchCategory>Renewable Energy</SearchCategory>
          </div>
        </section>

        <section className="mb-40">
          <h1 className="py-8">
            <TextDecorationBolder className="font-normal">
              Process and Analyse
            </TextDecorationBolder>
          </h1>

          <p className="text-xl">
            We take data processing and analysis to new heights with our
            seamless Jupyter Notebook integration. No need to switch between
            applications or download files; you can now process all the
            information from your datasets directly within the web application.
            Leverage the full power of Jupyter Notebooks' interactive and
            collaborative environment, harnessing its rich libraries and tools
            for data exploration, visualization, and advanced analytics.
            Experience unparalleled convenience and efficiency as you work with
            your datasets in real-time.
          </p>
        </section>

        <section className="mb-40">
          <h1 className="py-8">
            <TextDecorationBolder className="font-normal">
              Research Group
            </TextDecorationBolder>
          </h1>

          <p className="text-xl">
            The Datamap Project is led by a dedicated and interdisciplinary team of experts from various fields, united by a common goal: to create an innovative platform that seamlessly integrates observational data and modeling components. Our working group includes researchers, data scientists, software developers, and visualization specialists who are passionate about leveraging advanced technologies to push the boundaries of scientific discovery.
          </p>

          <div className="w-full flex flex-row gap-8 flex-wrap justify-center py-12">
            {props.researchers.profiles.map((profile, i) =>
              <Researcher key={i} profile={profile} />
            )}
          </div>
        </section>

        <section className="mb-40">
          <h1 className="py-8">
            <TextDecorationBolder className="font-normal">
              Partners and Supporters
            </TextDecorationBolder>
          </h1>
          <h2>Institutions</h2>
          <p>Our project is proudly supported by leading institutions in Brazil</p>

          <div className="flex flex-row gap-8 justify-center p-8">
            <a href="https://www.usp.br/" target="_blank">
              <img className="grayscale hover:grayscale-0 inline-block w-64 self-center" src="/img/partners-supporters/usp-logo.png" alt="University of São Paulo (USP)" />
            </a>
            <a href="https://www.gov.br/inpe" target="_blank">
              <img className="grayscale hover:grayscale-0 inline-block w-40 self-center" src="/img/partners-supporters/inpe-logo.png" alt="National Institute for Space Research (INPE)" />
            </a>
            <a href="https://www.unicamp.br/" target="_blank">
              <img className="grayscale hover:grayscale-0 inline-block w-28 self-center" src="/img/partners-supporters/unicamp-logo.svg" alt="University of Campinas (Unicamp)" />
            </a>
          </div>

          <h2>Supporters</h2>
          <p>
            We gratefully acknowledge the generous support from our sponsors
          </p>
          <div className="flex flex-row gap-8 justify-center p-4">
            <a href="https://datacite.org/" target="_blank">
              <img className="grayscale hover:grayscale-0 inline-block w-64 self-center" src="/img/partners-supporters/datacite-logo.png" alt="DataCite" />
            </a>
            <a href="https://www.shell.com.br/" target="_blank">
              <img className="grayscale hover:grayscale-0 inline-block w-20 self-center" src="/img/partners-supporters/shell-logo.png" alt="Shell" />
            </a>
            <a href="https://fapesp.br/" target="_blank">
              <img className="grayscale hover:grayscale-0 inline-block w-64 h-fit self-center" src="/img/partners-supporters/fapesp-logo.png" alt="São Paulo Research Foundation (Fapesp)" />
            </a>
          </div>
          <h2>Collaboration</h2>
          <p>
            We are excited to collaborate with the Atmospheric Radiation Measurement (ARM) user facility, which enhances our research capabilities and broadens our scientific reach.
          </p>
          <div className="flex flex-row gap-8 justify-center p-4">
            <a href="https://www.arm.gov/" target="_blank">
              <img className="grayscale hover:grayscale-0 inline-block w-64 self-center" src="/img/partners-supporters/arm-logo.png" alt="Atmospheric Radiation Measurement (ARM)" />
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
}

interface ResearcherProps {
  profile: {
    name: string
    role: string
    profilePicture?: string
    orcid?: string
  }
}

function Researcher(props: ResearcherProps) {

  function profilePictureUrl() {
    return props.profile.profilePicture ?? "/img/researcher-profile/default-profile.webp"
  }

  function ResearcherContainer() {
    return (
      <div className="flex flex-col w-fit items-center">
        <div id="tooltip-jese" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          {props.profile.name}
        </div>
        <img className="rounded w-52 h-52" src={profilePictureUrl()} alt={`${props.profile.name} - ${props.profile.role}`} />
        <h5 className="text-center">{props.profile.name}{props.profile.orcid &&
          <img src="/img/orcid-logo.svg" className="w-4 inline-block ml-2" />
        }</h5>
        <span className="font-light">{props.profile.role}</span>
      </div>
    )
  }

  return <>
    {!props.profile.orcid && <ResearcherContainer />}
    {props.profile.orcid &&
      <a href={`https://orcid.org/${props.profile.orcid}`}>
        <ResearcherContainer />
      </a>}
  </>
}

export async function getStaticProps() {
  const researchers = require("/public/data/researchers.json");

  return {
    props: {
      researchers,
    },
  }
}