import { MaterialSymbol } from 'react-material-symbols';

interface ContextMenuButtonItemProps {
  text?: string;
  iconName?: string
  children?: any;
  onClick?(): void;
}
export function ContextMenuButtonItem(props: ContextMenuButtonItemProps) {
  return (
    <div className="py-3 hover:bg-primary-200 cursor-pointer px-2 my-1" onClick={props.onClick}>
      <div className="inline-block align-middle">
        {props.children}
        <MaterialSymbol icon={props.iconName} size={26} grade={-25} weight={100} className="align-middle pl-2" />
      </div>
      <span className="font-light px-4">
        {props.text}
      </span>
    </div>
  );
}