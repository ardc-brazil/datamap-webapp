import React from 'react'
import { ResearcherProfile } from "../../components/ResearcherProfile";
import Layout from "../../components/Layout";

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
        <Layout>
            <h1>
                Research Group
            </h1>

            <p className="text-xl">
                The Datamap Project is led by a dedicated and interdisciplinary team of experts from various fields, united by a common goal: to create an innovative platform that seamlessly integrates observational data and modeling components. Our working group includes researchers, data scientists, software developers, and visualization specialists who are passionate about leveraging advanced technologies to push the boundaries of scientific discovery.
            </p>

            <div className="w-full flex flex-row gap-8 flex-wrap justify-center py-12">
                {props.researchers.profiles.map((profile, i) =>
                    <ResearcherProfile key={i} profile={profile} />
                )}
            </div>
        </Layout>

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