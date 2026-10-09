import { GetStaticProps } from "next";
import Head from "next/head";
import { ManualCapa } from "../../components/Manual/ManualCapa";
import { manualComponents } from "../../components/Manual/manualComponents";
import { PRINT_CSS } from "../../components/Manual/printCss";
import { formatLongDate, shortCommit } from "../../lib/buildInfo";
import { readChapters, toChapter } from "../../lib/manual";
import { MANUAL_CONTENT } from "../../lib/manualContent";
import { ManualChapter } from "../../lib/manualSearch";

interface ManualPrintProps {
  chapters: (ManualChapter & { arquivo: string })[];
  date: string;
  commit: string;
}

export const getStaticProps: GetStaticProps<ManualPrintProps> = async () => ({
  props: {
    chapters: readChapters().map((chapter) => ({ ...toChapter(chapter), arquivo: chapter.arquivo })),
    date: formatLongDate(new Date()),
    commit: shortCommit(),
  },
});

export default function ManualPrintPage({ chapters, date, commit }: ManualPrintProps) {
  return (
    <main className="manual-impressao">
      <Head>
        <title>Guia do usuário · DataMap</title>
        <meta name="robots" content="noindex" />
      </Head>
      <style>{PRINT_CSS}</style>
      <ManualCapa chapters={chapters} date={date} commit={commit} />
      {chapters.map((chapter) => {
        const Conteudo = MANUAL_CONTENT[chapter.arquivo];
        return (
          <article key={chapter.slug} id={`capitulo-${chapter.slug}`} className="manual-capitulo">
            <p className="manual-capitulo-numero">Capítulo {chapter.ordem}</p>
            <h1>{chapter.titulo}</h1>
            <p className="manual-capitulo-resumo">{chapter.resumo}</p>
            <Conteudo components={manualComponents} />
          </article>
        );
      })}
    </main>
  );
}
