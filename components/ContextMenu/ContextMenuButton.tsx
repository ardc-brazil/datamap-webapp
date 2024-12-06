import React from "react";
import { MaterialSymbol } from 'react-material-symbols';
import useComponentVisible from "../../hooks/UseComponentVisible";

interface ContextMenuButtonProps {
  disabled?: any
  className?: any;
  children: any
}

export function ContextMenuButton(props: ContextMenuButtonProps) {

  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  function onClick(): void {
    setIsComponentVisible(true);
  }

  return (
    <div className={`relative flex justify-end ${props.className}`}>
      <button type="button" className="flex items-center justify-center btn-primary-outline-basic rounded-full w-12 h-12" onClick={onClick} disabled={props.disabled}>
        {React.Children.count(props.children) > 1 &&
          <div>{props.children[0]}</div>
        }

        {React.Children.count(props.children) <= 1 &&
          <MaterialSymbol icon="more_vert" size={32} grade={-25} weight={400} className="align-middle" />
        }
      </button>

      <div ref={ref} className={`${!isComponentVisible && "hidden"} absolute top-12 bg-primary-50 border border-primary-200 shadow shadow-primary-300 rounded-md py-2 w-${!props.size ? '72' : props.size}`}>
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