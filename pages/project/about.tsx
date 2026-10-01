import Link from "next/link";
import React from 'react'
import { MaterialSymbol } from "react-material-symbols";
import { ProjectCallout, ProjectCard, ProjectPage, ProjectSection } from "../../components/Project/ProjectPage";
import { ResearcherProfile } from "../../components/ResearcherProfile";
import { ROUTE_PAGE_SEARCH } from "../../contants/InternalRoutesConstants";

export default function AboutPage(props) {
  return (
    <ProjectPage
      title="Welcome to the Datamap Project"
      lede="An interdisciplinary team building a platform that brings observational data and modeling together, so researchers can find, analyse and share atmospheric data in one place."
    >
      <ProjectSection title="Who we are" first>
        <p>The Datamap Project is spearheaded by a dedicated and interdisciplinary team of experts from various fields, all united by a common goal: to create an innovative platform that seamlessly integrates observational data and modeling components. Our working group (WG) is composed of researchers, data scientists, software developers, and visualization specialists who are passionate about leveraging advanced technologies to push the boundaries of scientific discovery.</p>
      </ProjectSection>

      <ProjectSection title="Our mission">
        <p>At the heart of the Datamap Project is a commitment to innovation and collaboration. We aim to create a platform that not only provides access to massive datasets but also enables the performance of specific studies through advanced analytical tools. By integrating observational and modeling components, we strive to offer a comprehensive system that supports complex research endeavors.</p>
        <p>Furthermore, we recognize the transformative potential of Artificial Intelligence in scientific research. Our group actively collaborates with other working groups to develop AI-driven methodologies that enrich our understanding and foster groundbreaking discoveries.</p>
      </ProjectSection>

      <ProjectSection title="Meet our team" stacked>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <ProjectCard title="Researchers and data scientists" icon={<MaterialSymbol icon="science" size={22} weight={400} grade={-25} className="text-primary-700" />}>
            <p>Our researchers and data scientists bring a wealth of knowledge in fields such as climate science, ecology, geosciences, and more. They are the driving force behind our efforts to harness vast amounts of data to uncover insights into complex processes that are often challenging to visualize and understand.</p>
          </ProjectCard>
          <ProjectCard title="Software developers" icon={<MaterialSymbol icon="code" size={22} weight={400} grade={-25} className="text-primary-700" />}>
            <p>Our team of software developers is dedicated to building a robust and user-friendly platform. They ensure that the Datamap system is open, accessible, and capable of handling sophisticated cloud-based analyses. Their expertise in big data and scientific visualization tools is crucial to the development of our platform.</p>
          </ProjectCard>
          <ProjectCard title="Visualization specialists" icon={<MaterialSymbol icon="monitoring" size={22} weight={400} grade={-25} className="text-primary-700" />}>
            <p>Understanding complex data requires powerful visualization tools. Our visualization specialists are skilled in creating intuitive and informative visual representations of data. Their work makes it possible to see and interpret complex processes in ways that were previously impossible.</p>
          </ProjectCard>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          {props.researchers.profiles.map((profile, i) =>
            <ResearcherProfile key={i} profile={profile} />
          )}
        </div>
      </ProjectSection>

      <ProjectCallout
        title="Join us on our journey"
        actions={
          <>
            <Link href={ROUTE_PAGE_SEARCH} className="inline-flex items-center px-5 py-3 rounded-md bg-primary-50 text-primary-900 text-[15px] font-semibold hover:bg-primary-200 hover:text-primary-900">Browse datasets</Link>
            <Link href="/project/support" className="inline-flex items-center px-5 py-3 rounded-md border border-primary-700 text-primary-50 text-[15px] font-semibold hover:border-primary-400 hover:text-primary-50">Get in touch</Link>
          </>
        }
      >
        <p>We invite you to explore the Datamap Project and become a part of our journey towards revolutionizing data access and analysis. Whether you are a researcher, a data enthusiast, or simply curious about the possibilities of big data and AI in scientific research, there is a place for you in our community.</p>
        <p>Together, we can achieve remarkable advancements and unlock new frontiers of knowledge.</p>
      </ProjectCallout>
    </ProjectPage>
  )
}

export async function getStaticProps() {
  const researchers = require("./../../public/data/researchers.json");

  return {
    props: {
      researchers,
    },
  }
}
