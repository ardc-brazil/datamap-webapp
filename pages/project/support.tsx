import React from 'react'
import { MaterialSymbol, SymbolCodepoints } from "react-material-symbols";
import { ProjectPage, ProjectSection } from "../../components/Project/ProjectPage";

const USER_MANUAL_URL = "https://docs.google.com/document/d/1U46J67JKt82u2mj1mKKC1BJSid0BifnFHf4Aw0chOHo/edit#heading=h.8yi650lks7ua";

interface ChannelProps {
    icon: SymbolCodepoints;
    title: string;
    children: React.ReactNode;
    href: string;
    action: string;
    external?: boolean;
}

function SupportChannel(props: ChannelProps) {
    return (
        <div className="flex flex-col gap-5 rounded-lg border border-primary-200 bg-primary-0 p-6">
            <span className="flex items-center justify-center w-10 h-10 rounded-md bg-secondary-500">
                <MaterialSymbol icon={props.icon} size={22} weight={400} grade={-25} className="text-primary-900" />
            </span>
            <div className="flex flex-col gap-2 flex-1">
                <h3 className="m-0 text-lg">{props.title}</h3>
                <div className="text-sm leading-[22px] text-primary-700 [&_p]:m-0 [&_p]:text-sm [&_p]:leading-[22px]">{props.children}</div>
            </div>
            <a
                href={props.href}
                target={props.external ? "_blank" : undefined}
                rel={props.external ? "noreferrer" : undefined}
                className="self-start inline-flex items-center gap-2 rounded-md border border-primary-300 bg-primary-0 px-3.5 py-2 text-sm font-semibold text-primary-900 hover:border-primary-500 hover:text-primary-900"
            >
                {props.action}
                <MaterialSymbol icon={props.external ? "open_in_new" : "mail"} size={18} weight={400} grade={-25} />
            </a>
        </div>
    );
}

export default function SupportPage() {
    return (
        <ProjectPage
            title="Support"
            lede="We are committed to providing you with the assistance you need to make the most of our platform. Whether you are new to Datamap or an experienced user, we have resources to help you navigate and utilize our system effectively."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-12 md:py-16">
                <SupportChannel icon="menu_book" title="User manual" href={USER_MANUAL_URL} action="Access the user manual" external>
                    <p>Step-by-step instructions, tips, and troubleshooting advice to help you with all aspects of the platform.</p>
                </SupportChannel>
                <SupportChannel icon="support_agent" title="Institutional support" href="mailto:pedro.correa@usp.br" action="pedro.correa@usp.br">
                    <p>For inquiries or personalized assistance about the project, Pedro is available to help.</p>
                </SupportChannel>
                <SupportChannel icon="engineering" title="Technical support" href="mailto:amaia@usp.br" action="amaia@usp.br">
                    <p>If you encounter any issues using the platform, our technical support team is here to help.</p>
                </SupportChannel>
            </div>

            <ProjectSection title="Frequently asked questions">
                <p>Explore our FAQ section for quick answers to common questions about Datamap. This section covers a wide range of topics, from basic features to advanced functionalities.</p>
            </ProjectSection>

            <ProjectSection title="Community forum">
                <p>Join our community forum to connect with other Datamap users, share experiences, and seek advice. The forum is a great place to exchange ideas, learn from others, and stay updated on the latest developments and best practices.</p>
            </ProjectSection>

            <ProjectSection title="Feedback">
                <p>Thank you for using Datamap. We are dedicated to ensuring your experience with our platform is as smooth and productive as possible. If you have any feedback or suggestions, please do not hesitate to contact us.</p>
            </ProjectSection>
        </ProjectPage>
    )
}
