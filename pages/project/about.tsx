import React from 'react'
import Layout from "../../components/Layout"
import { ResearcherProfile } from "../../components/ResearcherProfile";

export default function AboutPage(props) {
  return (
    <Layout >
      <h1>About</h1>
      <h3>Welcome to the Datamap Project!</h3>

      <p>The Datamap Project is spearheaded by a dedicated and interdisciplinary team of experts from various fields, all united by a common goal: to create an innovative platform that seamlessly integrates observational data and modeling components. Our working group (WG) is composed of researchers, data scientists, software developers, and visualization specialists who are passionate about leveraging advanced technologies to push the boundaries of scientific discovery.</p>

      <h3>Our Mission</h3>
      <p>At the heart of the Datamap Project is a commitment to innovation and collaboration. We aim to create a platform that not only provides access to massive datasets but also enables the performance of specific studies through advanced analytical tools. By integrating observational and modeling components, we strive to offer a comprehensive system that supports complex research endeavors.</p>

      <p>Furthermore, we recognize the transformative potential of Artificial Intelligence in scientific research. Our group actively collaborates with other working groups to develop AI-driven methodologies that enrich our understanding and foster groundbreaking discoveries.
      </p>

      <h3>Meet Our Team</h3>
      <h5>Researchers and Data Scientists</h5>
      <p>Our researchers and data scientists bring a wealth of knowledge in fields such as climate science, ecology, geosciences, and more. They are the driving force behind our efforts to harness vast amounts of data to uncover insights into complex processes that are often challenging to visualize and understand.</p>

      <h5>Software Developers</h5>
      <p>Our team of software developers is dedicated to building a robust and user-friendly platform. They ensure that the Datamap system is open, accessible, and capable of handling sophisticated cloud-based analyses. Their expertise in big data and scientific visualization tools is crucial to the development of our platform.</p>

      <h5>Visualization Specialists</h5>
      <p>Understanding complex data requires powerful visualization tools. Our visualization specialists are skilled in creating intuitive and informative visual representations of data. Their work makes it possible to see and interpret complex processes in ways that were previously impossible.</p>

      <div className="w-full flex flex-row gap-8 flex-wrap justify-center py-12">
        {props.researchers.profiles.map((profile, i) =>
          <ResearcherProfile key={i} profile={profile} />
        )}
      </div>

      <h3>Join Us on Our Journey</h3>

      <p>We invite you to explore the Datamap Project and become a part of our journey towards revolutionizing data access and analysis. Whether you are a researcher, a data enthusiast, or simply curious about the possibilities of big data and AI in scientific research, there is a place for you in our community.</p>

      <p>Together, we can achieve remarkable advancements and unlock new frontiers of knowledge. Welcome to the future of data-driven research with the Datamap Project!</p>
    </Layout >
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