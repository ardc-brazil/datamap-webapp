import React from 'react'
import Layout from "../../components/Layout"

export default function PartnersAndSupporters() {
    return (
        <Layout>
            <h1 className="py-8">
                Partners and Supporters
            </h1>
            <p>
                We are proud to collaborate with esteemed institutions and organizations that share our commitment to advancing scientific research and innovation. Our partners and supporters play a crucial role in the success of the Datamap Project, providing invaluable resources, expertise, and funding.
            </p>

            <h3>Institutions</h3>
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

            <h3>Supporters</h3>
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
            <h3>Collaboration</h3>
            <p>
                We are excited to collaborate with the Atmospheric Radiation Measurement (ARM) user facility, which enhances our research capabilities and broadens our scientific reach.
            </p>
            <div className="flex flex-row gap-8 justify-center p-4">
                <a href="https://www.arm.gov/" target="_blank">
                    <img className="grayscale hover:grayscale-0 inline-block w-64 self-center" src="/img/partners-supporters/arm-logo.png" alt="Atmospheric Radiation Measurement (ARM)" />
                </a>
            </div>

        </Layout>
    )
}
