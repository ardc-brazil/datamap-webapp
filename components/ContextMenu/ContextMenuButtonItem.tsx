import { MaterialSymbol, SymbolCodepoints } from 'react-material-symbols';

interface ContextMenuButtonItemProps {
  text?: string;
  iconName?: SymbolCodepoints
  children?: any;
  destructive?: boolean;
  onClick?(): void;
}

export function ContextMenuButtonItem(props: ContextMenuButtonItemProps) {
  const colors = props.destructive
    ? "text-error-600 hover:bg-primary-100"
    : "text-primary-900 hover:bg-primary-100";

  return (
    <div
      role="menuitem"
      className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${colors}`}
      onClick={props.onClick}
    >
      {props.children}
      {props.iconName &&
        <MaterialSymbol icon={props.iconName} size={20} grade={-25} weight={400} className="flex-none" />
      }
      <span>{props.text}</span>
    </div>
  );
}
