import React from 'react'
import { ProjectPage, ProjectSection } from "../../components/Project/ProjectPage";

interface Partner {
    href: string;
    src: string;
    alt: string;
    width: string;
}

const INSTITUTIONS: Partner[] = [
    { href: "https://www.usp.br/", src: "/img/partners-supporters/usp-logo.png", alt: "University of São Paulo (USP)", width: "w-40" },
    { href: "https://www.gov.br/inpe", src: "/img/partners-supporters/inpe-logo.png", alt: "National Institute for Space Research (INPE)", width: "w-24" },
    { href: "https://www.unicamp.br/", src: "/img/partners-supporters/unicamp-logo.svg", alt: "University of Campinas (Unicamp)", width: "w-20" },
];

const SUPPORTERS: Partner[] = [
    { href: "https://datacite.org/", src: "/img/partners-supporters/datacite-logo.png", alt: "DataCite", width: "w-44" },
    { href: "https://www.shell.com.br/", src: "/img/partners-supporters/shell-logo.png", alt: "Shell", width: "w-14" },
    { href: "https://fapesp.br/", src: "/img/partners-supporters/fapesp-logo.png", alt: "São Paulo Research Foundation (Fapesp)", width: "w-40" },
];

const COLLABORATORS: Partner[] = [
    { href: "https://www.arm.gov/", src: "/img/partners-supporters/arm-logo.png", alt: "Atmospheric Radiation Measurement (ARM)", width: "w-40" },
];

function LogoGrid(props: { partners: Partner[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {props.partners.map((partner) => (
                <a
                    key={partner.href}
                    href={partner.href}
                    target="_blank"
                    rel="noreferrer"
                    title={partner.alt}
                    className="group flex items-center justify-center h-36 rounded-lg border border-primary-200 bg-primary-0 p-6 hover:border-primary-400"
                >
                    <img className={`${partner.width} max-h-20 object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition`} src={partner.src} alt={partner.alt} />
                </a>
            ))}
        </div>
    );
}

export default function PartnersAndSupporters() {
    return (
        <ProjectPage
            title="Partners and supporters"
            lede="We are proud to collaborate with esteemed institutions and organizations that share our commitment to advancing scientific research and innovation. They provide invaluable resources, expertise, and funding."
        >
            <ProjectSection title="Institutions" first>
                <p>Our project is proudly supported by leading institutions in Brazil.</p>
                <LogoGrid partners={INSTITUTIONS} />
            </ProjectSection>

            <ProjectSection title="Supporters">
                <p>We gratefully acknowledge the generous support from our sponsors.</p>
                <LogoGrid partners={SUPPORTERS} />
            </ProjectSection>

            <ProjectSection title="Collaboration">
                <p>We are excited to collaborate with the Atmospheric Radiation Measurement (ARM) user facility, which enhances our research capabilities and broadens our scientific reach.</p>
                <LogoGrid partners={COLLABORATORS} />
            </ProjectSection>
        </ProjectPage>
    )
}
