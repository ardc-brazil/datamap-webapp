import React from 'react'
import { MaterialSymbol, SymbolCodepoints } from "react-material-symbols";
import { ProjectCard, ProjectPage, ProjectSection } from "../../components/Project/ProjectPage";

const CITATION_FIELDS = [
  "Title of the dataset",
  "Authors of the dataset",
  "Date of data publication",
  "Source: Datamap Project",
  "URL of the dataset",
];

const SHARING_RULES: { icon: SymbolCodepoints, text: string }[] = [
  { icon: "block", text: "Do not alter the data in any way that could mislead others." },
  { icon: "person_check", text: "Provide proper attribution to the original authors and the Datamap Project." },
  { icon: "link", text: "Include a link to the original dataset on the Datamap platform." },
];

export default function DataPolicyPage() {
  return (
    <ProjectPage
      title="Data policy"
      lede="We are dedicated to providing valuable datasets for research and analysis. Please review the following data policy to understand the terms and conditions related to the use of data from our platform."
    >
      <ProjectSection id="usage" title="Usage of data" first>
        <p>All data available on the Datamap platform is intended for research and academic purposes. Users are encouraged to utilize these datasets to advance their studies and projects.</p>
      </ProjectSection>

      <ProjectSection id="attribution" title="Notification of authors">
        <p>If you use any data originated from the Datamap Project in your research, publications, or presentations, you must notify the authors of the data. Proper attribution is required to acknowledge the contributions of the data providers. Please include the following information in your citations:</p>
        <ul className="m-0 p-0 rounded-lg border border-primary-200 bg-primary-0 divide-y divide-primary-100">
          {CITATION_FIELDS.map((field) => (
            <li key={field} className="flex items-center gap-3 px-4 h-12 text-[15px] text-primary-900">
              <MaterialSymbol icon="check_circle" size={20} weight={400} grade={-25} className="flex-none text-success-500" />
              {field}
            </li>
          ))}
        </ul>
      </ProjectSection>

      <ProjectSection id="sharing" title="Data sharing and redistribution">
        <p>You are permitted to share and redistribute data obtained from the Datamap Project, provided that you comply with the following conditions:</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {SHARING_RULES.map((rule) => (
            <ProjectCard key={rule.text} icon={<MaterialSymbol icon={rule.icon} size={22} weight={400} grade={-25} className="text-primary-700" />}>
              <p>{rule.text}</p>
            </ProjectCard>
          ))}
        </div>
      </ProjectSection>

      <ProjectSection id="disclaimer" title="Disclaimer">
        <div className="flex gap-4 rounded-lg bg-secondary-500 p-5">
          <MaterialSymbol icon="info" size={22} weight={400} grade={-25} className="flex-none text-primary-700" />
          <p className="!text-[15px] !leading-6">The Datamap Project makes no guarantees regarding the accuracy, completeness, or reliability of the data provided. Users are responsible for verifying the suitability of the data for their intended purposes. The Datamap Project and its contributors are not liable for any direct or indirect damages resulting from the use of the data.</p>
        </div>
      </ProjectSection>

      <ProjectSection id="contact" title="Contact us">
        <p>If you have any questions or require further information about our data policy, please do not hesitate to contact us.</p>
        <a href="mailto:amaia@usp.br" className="self-start inline-flex items-center gap-2.5 rounded-md border border-primary-300 bg-primary-0 px-4 py-2.5 text-[15px] font-semibold text-primary-900 hover:border-primary-500">
          <MaterialSymbol icon="mail" size={20} weight={400} grade={-25} />
          amaia@usp.br
        </a>
        <p>Thank you for using the Datamap Project. We appreciate your adherence to this data policy and your commitment to ethical data usage.</p>
      </ProjectSection>
    </ProjectPage>
  )
}
