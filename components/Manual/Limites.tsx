import { MaterialSymbol } from "react-material-symbols";

export function Limites({ children }: { children: React.ReactNode }) {
  return (
    <aside className="my-8 rounded-lg border border-primary-300 bg-primary-0 p-5 break-inside-avoid">
      <p className="m-0 mb-2 flex items-center gap-2 text-sm font-semibold text-primary-900">
        <MaterialSymbol icon="rule" size={20} weight={200} grade={-25} />
        Limites
      </p>
      <div className="text-[15px] leading-6 text-primary-700 [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-5">{children}</div>
    </aside>
  );
}
