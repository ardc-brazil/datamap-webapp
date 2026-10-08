import { MANUAL_PUBLIC_URL } from "../../contants/ManualConstants";
import { ManualChapter } from "../../lib/manualSearch";
import { Logo } from "../Brand/Logo";

interface ManualCapaProps {
  chapters: ManualChapter[];
  date: string;
  commit: string;
}

export function ManualCapa({ chapters, date, commit }: ManualCapaProps) {
  return (
    <>
      <section className="manual-capa">
        <Logo />
        <h1>Guia do usuário</h1>
        <p className="manual-capa-lede">Como o DataMap funciona, como usar cada ferramenta e quais são os limites.</p>
        <p className="manual-capa-meta">{date} · versão {commit}</p>
        <p className="manual-capa-meta">{MANUAL_PUBLIC_URL}</p>
      </section>
      <nav className="manual-indice" aria-label="Capítulos do guia">
        <h2>Capítulos</h2>
        <ol>
          {chapters.map((chapter) => (
            <li key={chapter.slug}>
              <a href={`#capitulo-${chapter.slug}`}>{chapter.ordem}. {chapter.titulo}</a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
