import { MANUAL_IMAGE_URL } from "../../contants/ManualConstants";

interface CapturaProps {
  nome: string;
  alt: string;
  legenda?: string;
}

export function Captura({ nome, alt, legenda }: CapturaProps) {
  if (!alt || alt.trim() === "") {
    throw new Error(`Captura "${nome}": o alt é obrigatório`);
  }

  return (
    <figure className="my-8 mx-0">
      <img
        src={`${MANUAL_IMAGE_URL}/${nome}.png`}
        alt={alt}
        loading="lazy"
        className="block w-full h-auto rounded-lg border border-primary-200"
      />
      {legenda && (
        <figcaption className="mt-2 text-[13px] leading-5 text-primary-500">{legenda}</figcaption>
      )}
    </figure>
  );
}
