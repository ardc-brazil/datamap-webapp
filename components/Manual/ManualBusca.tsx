import Link from "next/link";
import { useState } from "react";
import { SearchEntry, searchManual } from "../../lib/manualSearch";

export function ManualBusca({ index }: { index: SearchEntry[] }) {
  const [query, setQuery] = useState("");
  const results = searchManual(index, query);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar no guia"
        aria-label="Buscar no guia"
        data-testid="manual-search"
        className="w-full rounded-md border border-primary-300 bg-primary-0 px-3 py-2 text-sm text-primary-900"
      />
      {query.trim() !== "" && (
        <ul className="m-0 flex list-none flex-col p-0" aria-live="polite">
          {results.length === 0 && <li className="px-1 py-2 text-sm text-primary-500">Nada encontrado.</li>}
          {results.slice(0, 8).map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href} className="block rounded-md px-2 py-1.5 text-sm text-primary-900 hover:bg-primary-100">
                {entry.titulo}
                {entry.titulo !== entry.capitulo && (
                  <span className="block text-xs text-primary-500">{entry.capitulo}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
