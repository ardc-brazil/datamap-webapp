import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.

export function ContextMenuButtonItem(props: any) {
  return (
    <div className="py-3 hover:bg-primary-200 cursor-pointer px-2 my-1" onClick={props.onClick}>
      <div className="inline-block align-middle">
        {props.children}
        <MaterialSymbol icon={props.iconName} size={32} grade={-25} weight={200} className="align-middle" />
      </div>
      <span className="font-light">
        {props.text}
      </span>
    </div>
  );
}