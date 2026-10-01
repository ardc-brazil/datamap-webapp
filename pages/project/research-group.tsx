import React from 'react'
import { ProjectPage } from "../../components/Project/ProjectPage";
import { ResearcherProfile } from "../../components/ResearcherProfile";

interface Props {
    researchers: {
        profiles: {
            name: string
            role: string
            profilePicture?: string
            orcid?: string
        }[]
    }
}

export default function ResearchGroupPage(props: Props) {
    return (
        <ProjectPage
            title="Research group"
            lede="The Datamap Project is led by a dedicated and interdisciplinary team of experts from various fields, united by a common goal: to create an innovative platform that seamlessly integrates observational data and modeling components."
        >
            <p className="mt-12 mb-0 max-w-3xl text-[17px] leading-7 text-primary-700">
                Our working group includes researchers, data scientists, software developers, and visualization specialists who are passionate about leveraging advanced technologies to push the boundaries of scientific discovery.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-10">
                {props.researchers.profiles.map((profile, i) =>
                    <ResearcherProfile key={i} profile={profile} />
                )}
            </div>
        </ProjectPage>
    )
}

export async function getStaticProps() {
    const researchers = require("/public/data/researchers.json");

    return {
        props: {
            researchers,
        } as Props,
    }
}
