import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import useComponentVisible from "../../hooks/UseComponentVisible";


export function ContextMenuButton(props: any) {

  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  function onClick(event): void {
    setIsComponentVisible(true);
  }

  return (
    <div className="relative flex justify-end">
      <button type="button" className="btn-primary-outline-basic rounded-full w-12 h-12" onClick={onClick}>
        <MaterialSymbol icon="more_vert" size={32} grade={-25} weight={400} className="align-middle" />
      </button>

      <div ref={ref} className={`${!isComponentVisible && "hidden"} absolute top-12 bg-primary-50 border border-primary-200 shadow shadow-primary-300 rounded-md py-2 w-${!props.size ? '72' : props.size}`}>
        {props.children}
      </div>

    </div>
  );
}