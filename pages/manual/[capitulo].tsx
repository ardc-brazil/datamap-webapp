import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ManualLayout } from "../../components/Manual/ManualLayout";
import { manualComponents } from "../../components/Manual/manualComponents";
import { MANUAL_ROUTE } from "../../contants/ManualConstants";
import { readChapters, toChapter } from "../../lib/manual";
import { MANUAL_CONTENT } from "../../lib/manualContent";
import { ManualChapter } from "../../lib/manualSearch";

interface ManualChapterProps {
  chapters: ManualChapter[];
  arquivo: string;
  slug: string;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: readChapters().map((chapter) => ({ params: { capitulo: chapter.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ManualChapterProps> = async ({ params }) => {
  const all = readChapters();
  const chapter = all.find((candidate) => candidate.slug === params?.capitulo);

  if (!chapter) {
    return { notFound: true };
  }
  return { props: { chapters: all.map(toChapter), arquivo: chapter.arquivo, slug: chapter.slug } };
};

export default function ManualChapterPage({ chapters, arquivo, slug }: ManualChapterProps) {
  const index = chapters.findIndex((chapter) => chapter.slug === slug);
  const current = chapters[index];
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  const Conteudo = MANUAL_CONTENT[arquivo];

  return (
    <ManualLayout chapters={chapters} current={current}>
      <Head>
        <title>{`${current.titulo} · Guia do usuário · DataMap`}</title>
      </Head>
      <Conteudo components={manualComponents} />
      <nav aria-label="Capítulos vizinhos" className="mt-16 flex justify-between gap-4 border-t border-primary-200 pt-6 text-sm">
        {previous ? <Link href={`${MANUAL_ROUTE}/${previous.slug}`}>← {previous.titulo}</Link> : <span />}
        {next ? <Link href={`${MANUAL_ROUTE}/${next.slug}`}>{next.titulo} →</Link> : <span />}
      </nav>
    </ManualLayout>
  );
}
