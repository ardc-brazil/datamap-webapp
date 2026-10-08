const ETAPAS = [
  { titulo: "Navegador", detalhe: "você escolhe os arquivos" },
  { titulo: "Servidor de envio", detalhe: "tusd, retoma se cair" },
  { titulo: "Área temporária", detalhe: "ainda sem download" },
  { titulo: "Dataset", detalhe: "o arquivo é registrado" },
  { titulo: "Armazenamento", detalhe: "Archivist, já baixável" },
];

const LARGURA = 168;
const ESPACO = 40;

export function FluxoEnvio() {
  const total = ETAPAS.length * LARGURA + (ETAPAS.length - 1) * ESPACO;

  return (
    <div className="my-8 overflow-x-auto rounded-lg border border-primary-200 bg-primary-0 p-4 break-inside-avoid">
      <svg
        role="img"
        aria-label={`Caminho do arquivo: ${ETAPAS.map((etapa) => etapa.titulo).join(", depois ")}.`}
        viewBox={`0 0 ${total} 96`}
        className="block min-w-[720px] w-full h-auto"
      >
        {ETAPAS.map((etapa, i) => {
          const x = i * (LARGURA + ESPACO);
          return (
            <g key={etapa.titulo}>
              <rect x={x} y={8} width={LARGURA} height={80} rx={8} className="fill-primary-50 stroke-primary-300" />
              <text x={x + LARGURA / 2} y={44} textAnchor="middle" className="fill-primary-900 text-[15px] font-semibold">
                {etapa.titulo}
              </text>
              <text x={x + LARGURA / 2} y={66} textAnchor="middle" className="fill-primary-600 text-[12px]">
                {etapa.detalhe}
              </text>
              {i < ETAPAS.length - 1 && (
                <path
                  d={`M${x + LARGURA + 8} 48 H${x + LARGURA + ESPACO - 8} m-6 -5 l6 5 l-6 5`}
                  className="fill-none stroke-primary-900"
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
