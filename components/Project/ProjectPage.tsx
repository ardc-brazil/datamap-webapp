import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../Layout";

const PROJECT_PAGES = [
  { href: "/project/about", label: "About" },
  { href: "/project/research-group", label: "Research group" },
  { href: "/project/partners-and-supporters", label: "Partners" },
  { href: "/project/data-policy", label: "Data policy" },
  { href: "/project/support", label: "Support" },
];

interface ProjectPageProps {
  title: string;
  lede: React.ReactNode;
  children: React.ReactNode;
}

export function ProjectPage(props: ProjectPageProps) {
  const router = useRouter();

  return (
    <Layout fluid={true}>
      <header className="border-b border-primary-200">
        <div className="container mx-auto px-8 pt-16 md:pt-24 pb-12 md:pb-16">
          <nav aria-label="Project pages" className="flex flex-wrap gap-1.5 mb-10">
            {PROJECT_PAGES.map((page) => {
              const active = router.pathname === page.href;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${active
                    ? "bg-primary-900 text-primary-50 hover:text-primary-50"
                    : "bg-primary-0 border border-primary-200 text-primary-700 hover:border-primary-400 hover:text-primary-900"
                    }`}
                >
                  {page.label}
                </Link>
              );
            })}
          </nav>
          <h1 className="m-0 max-w-4xl text-4xl md:text-[56px] leading-[1.05] font-semibold tracking-[-0.03em]">
            {props.title}
          </h1>
          <p className="mt-6 mb-0 max-w-3xl text-lg md:text-xl leading-8 text-primary-700">
            {props.lede}
          </p>
        </div>
      </header>
      <div className="container mx-auto px-8 pb-12">
        {props.children}
      </div>
    </Layout>
  );
}

interface ProjectSectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
  first?: boolean;
  stacked?: boolean;
}

export function ProjectSection(props: ProjectSectionProps) {
  return (
    <section
      id={props.id}
      className={`grid grid-cols-1 ${props.stacked ? "gap-8" : "md:grid-cols-[4fr_8fr] gap-4 md:gap-16"} py-12 md:py-16 scroll-mt-20 ${props.first ? "" : "border-t border-primary-200"}`}
    >
      <h2 className="m-0 text-2xl md:text-[28px] leading-tight font-semibold tracking-[-0.02em]">{props.title}</h2>
      <div className="min-w-0 flex flex-col gap-4 text-[17px] leading-7 text-primary-700 [&_p]:m-0 [&_p]:text-[17px] [&_p]:leading-7">
        {props.children}
      </div>
    </section>
  );
}

export function ProjectCard(props: { title?: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 rounded-lg border border-primary-200 bg-primary-0 p-5 ${props.className ?? ""}`}>
      {props.icon}
      {props.title && <span className="text-[15px] font-semibold text-primary-900">{props.title}</span>}
      <div className="text-sm leading-[22px] text-primary-700 [&_p]:m-0 [&_p]:text-sm [&_p]:leading-[22px]">{props.children}</div>
    </div>
  );
}

export function ProjectCallout(props: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="my-12 rounded-xl bg-primary-900 text-primary-50 px-8 py-12 md:px-14 md:py-16 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-8 items-end">
      <div className="flex flex-col gap-4 max-w-2xl">
        <h2 className="m-0 text-3xl md:text-[40px] leading-[1.1] font-semibold tracking-[-0.025em] text-primary-50">{props.title}</h2>
        <div className="text-[17px] leading-7 text-primary-300 [&_p]:m-0 [&_p]:text-primary-300 [&_p]:text-[17px] [&_p]:leading-7 flex flex-col gap-3">{props.children}</div>
      </div>
      {props.actions && <div className="flex flex-wrap gap-3">{props.actions}</div>}
    </section>
  );
}
