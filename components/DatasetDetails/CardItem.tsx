import { ReactNode } from "react";
import { MaterialSymbol } from "react-material-symbols";

interface Props {
  children: ReactNode;
  title: string;
  className?: any;
  info?: string
}
export function CardItem(props: Props) {
  return (
    <div className={`${props.className}`}>
      <div className="text-primary-400 font-semibold text-xs">
        <span className="uppercase">
          {props.title}
        </span>
        {props.info &&
          <div className='has-tooltip cursor-default inline'>
            <span className='tooltip rounded shadow-lg p-1 bg-gray-100 -mt-8 bg-primary-900 text-primary-50 max-w-xs'>
              {props.info}
            </span>
            &nbsp;<MaterialSymbol icon="info" size={16} grade={-25} weight={400} className="align-bottom inline" />
          </div>
        }
      </div>
      <div className="py-2">
        {props.children}
      </div>
    </div>
  );
}
