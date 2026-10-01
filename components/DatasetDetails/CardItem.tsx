import { ReactNode } from "react";
import { MaterialSymbol } from "react-material-symbols";
import slugify from "../../lib/textProcessor";

interface Props {
  children: ReactNode;
  title: string;
  className?: any;
  info?: string
  hide?: boolean
  testId?: string
}
export function CardItem(props: Props) {

  if (props.hide) {
    return null;
  }

  return (
    <div data-testid={props.testId} className={`${props.className ?? ""}`}>
      <div className="text-[11px] leading-4 tracking-[0.08em] font-semibold text-primary-500">
        <span className="uppercase">
          {props.title}
        </span>
        {props.info &&
          <div className='has-tooltip cursor-default inline'>
            <span className='tooltip rounded shadow-lg p-1 bg-gray-100 -mt-8 bg-primary-900 text-primary-50 font-normal max-w-xs'>
              {props.info}
            </span>
            &nbsp;<MaterialSymbol icon="info" size={16} grade={-25} weight={400} className="align-bottom inline" />
          </div>
        }
      </div>
      <div className="pt-1 text-sm text-primary-900" id={slugify(props.title)}>
        {props.children}
      </div>
    </div>
  );
}
