import { ReactNode } from "react";

interface FactRowProps {
  label: ReactNode
  children: ReactNode
  valueClassName?: string
}

export function FactRow(props: FactRowProps) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-3 border-b border-primary-100 last:border-b-0 text-sm">
      <span className="text-primary-500">{props.label}</span>
      <span className={`text-right text-primary-900 ${props.valueClassName ?? "font-medium"}`}>{props.children}</span>
    </div>
  );
}
