import React from "react";
import { MaterialSymbol, SymbolCodepoints } from 'react-material-symbols';
import useComponentVisible from "../../hooks/UseComponentVisible";

interface ContextMenuButtonProps {
  disabled?: any
  className?: any
  buttonClassName?: string
  menuClassName?: string
  iconName?: SymbolCodepoints
  iconSize?: number
  children: any
  size?: any
}

// Tailwind only generates class names it can read literally, so the width cannot be built as `w-${size}`.
const MENU_MIN_WIDTH_CLASSES: Record<string, string> = {
  "40": "min-w-[10rem]",
  "48": "min-w-[12rem]",
  "56": "min-w-[14rem]",
  "64": "min-w-[16rem]",
  "72": "min-w-[18rem]",
  "80": "min-w-[20rem]",
};

function menuWidthClass(size: any): string {
  return MENU_MIN_WIDTH_CLASSES[String(size)] ?? "min-w-[12rem]";
}

export function ContextMenuButton(props: ContextMenuButtonProps) {

  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  function onClick(): void {
    setIsComponentVisible(true);
  }

  return (
    <div className={`relative flex justify-end ${props.className ?? ""}`}>
      <button type="button" className={props.buttonClassName ?? "flex items-center justify-center btn-primary-outline-basic rounded-full w-12 h-12"} onClick={onClick} disabled={props.disabled}>
        {React.Children.count(props.children) > 1 &&
          <div>{props.children[0]}</div>
        }

        {React.Children.count(props.children) <= 1 &&
          <MaterialSymbol icon={props.iconName ?? "more_vert"} size={props.iconSize ?? 32} grade={-25} weight={400} className="align-middle" />
        }
      </button>

      <div
        ref={ref}
        role="menu"
        className={`${isComponentVisible ? "" : "hidden"} absolute right-0 top-full mt-1 z-20 bg-primary-0 border border-primary-200 shadow-lg shadow-primary-900/5 rounded-md py-1 ${menuWidthClass(props.size)} ${props.menuClassName ?? ""}`}
      >
        {React.Children.count(props.children) > 1 &&
          <>{props.children[1]}</>
        }

        {React.Children.count(props.children) <= 1 &&
          <>{props.children}</ >
        }
      </div>

    </div>
  );
}
