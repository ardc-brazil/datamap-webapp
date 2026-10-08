import Link from "next/link";
import useSWR from "swr";
import { MANUAL_ROUTE, MANUAL_SEARCH_INDEX_URL } from "../../contants/ManualConstants";
import { ManualChapter, SearchEntry } from "../../lib/manualSearch";
import Layout from "../Layout";
import { ManualBusca } from "./ManualBusca";

interface ManualLayoutProps {
  chapters: ManualChapter[];
  current?: ManualChapter;
  children: React.ReactNode;
}

const loadIndex = (url: string): Promise<SearchEntry[]> => fetch(url).then((response) => response.json());

function Indice({ chapters, current }: Pick<ManualLayoutProps, "chapters" | "current">) {
  const { data: index } = useSWR(MANUAL_SEARCH_INDEX_URL, loadIndex, { revalidateOnFocus: false });

  return (
    <div className="flex flex-col gap-4">
      <ManualBusca index={index ?? []} />
      <nav aria-label="Capítulos do guia">
        <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
          {chapters.map((chapter) => {
            const active = chapter.slug === current?.slug;
            return (
              <li key={chapter.slug}>
                <Link
                  href={`${MANUAL_ROUTE}/${chapter.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex gap-2 rounded-md px-2 py-1.5 text-sm ${active
                    ? "bg-primary-900 text-primary-50 hover:text-primary-50"
                    : "text-primary-700 hover:bg-primary-100 hover:text-primary-900"}`}
                >
                  <span className="w-5 flex-none tabular-nums opacity-60">{chapter.ordem}</span>
                  {chapter.titulo}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

export function ManualLayout({ chapters, current, children }: ManualLayoutProps) {
  return (
    <Layout fluid={true}>
      <div className="container mx-auto grid grid-cols-1 gap-8 px-8 py-10 lg:grid-cols-[240px_minmax(0,1fr)_200px]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <details className="lg:hidden rounded-lg border border-primary-200 bg-primary-0 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-primary-900">Capítulos do guia</summary>
            <div className="mt-3"><Indice chapters={chapters} current={current} /></div>
          </details>
          <div className="hidden lg:block"><Indice chapters={chapters} current={current} /></div>
        </aside>

        <article className="min-w-0 max-w-3xl text-[17px] leading-7 text-primary-700 [&_p]:my-4 [&_ol]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:border-b [&_th]:border-primary-300 [&_th]:py-2 [&_td]:border-b [&_td]:border-primary-200 [&_td]:py-2 [&_strong]:text-primary-900">
          {current && (
            <header className="mb-8">
              <p className="m-0 text-sm font-medium text-primary-500">Capítulo {current.ordem}</p>
              <h1 className="m-0 mt-1 text-4xl font-semibold tracking-[-0.03em] text-primary-900">{current.titulo}</h1>
              <p className="m-0 mt-3 text-lg text-primary-600">{current.resumo}</p>
            </header>
          )}
          {children}
        </article>

        {current && current.secoes.length > 0 && (
          <nav aria-label="Seções do capítulo" className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-primary-500">Neste capítulo</p>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {current.secoes.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-sm text-primary-600 hover:text-primary-900">{section.titulo}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </Layout>
  );
}
