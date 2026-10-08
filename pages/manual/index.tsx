import { GetStaticProps } from "next";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import { ManualLayout } from "../../components/Manual/ManualLayout";
import { MANUAL_PDF_URL, MANUAL_ROUTE } from "../../contants/ManualConstants";
import { readChapters, toChapter } from "../../lib/manual";
import { ManualChapter } from "../../lib/manualSearch";

interface ManualHomeProps {
  chapters: ManualChapter[];
}

export const getStaticProps: GetStaticProps<ManualHomeProps> = async () => ({
  props: { chapters: readChapters().map(toChapter) },
});

export default function ManualHome({ chapters }: ManualHomeProps) {
  return (
    <ManualLayout chapters={chapters}>
      <header className="mb-10">
        <h1 className="m-0 text-4xl md:text-[56px] leading-[1.05] font-semibold tracking-[-0.03em] text-primary-900">
          Guia do usuário
        </h1>
        <p className="mt-5 mb-0 text-xl leading-8 text-primary-600">
          Como o DataMap funciona, como usar cada ferramenta e quais são os limites.
        </p>
        <a
          href={MANUAL_PDF_URL}
          download
          data-testid="manual-download-pdf"
          className="btn-primary mt-6 inline-flex items-center gap-2 text-primary-50 hover:text-primary-50"
        >
          <MaterialSymbol icon="download" size={20} weight={400} grade={-25} />
          Baixar PDF
        </a>
      </header>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
        {chapters.map((chapter) => (
          <li key={chapter.slug} className="m-0">
            <Link
              href={`${MANUAL_ROUTE}/${chapter.slug}`}
              className="flex h-full flex-col gap-2 rounded-lg border border-primary-200 bg-primary-0 p-5 hover:border-primary-500"
            >
              <span className="text-xs font-semibold text-primary-500">Capítulo {chapter.ordem}</span>
              <span className="text-lg font-semibold text-primary-900">{chapter.titulo}</span>
              <span className="text-sm leading-[22px] text-primary-600">{chapter.resumo}</span>
            </Link>
          </li>
        ))}
      </ul>
    </ManualLayout>
  );
}
