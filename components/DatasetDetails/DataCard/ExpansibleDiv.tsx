import { useEffect, useRef, useState } from "react";
import { ViewMoreOrLessButton } from "./ViewMoreOrLessButton";

interface ExpansibleDivProps {
  forceExpanded: boolean;
  children: React.ReactNode;
  expanded?: boolean;
}

export function ExpansibleDiv(props: ExpansibleDivProps) {
  const [minHeightExpandable, setMinHeightExpandable] = useState(false);
  const [expanded, setExpanded] = useState(props.expanded);
  const ref = useRef(null);

  const minHeight = 300;

  useEffect(() => {
    setMinHeightExpandable(ref.current.clientHeight > minHeight);
  }, []);

  function toggleView() {
    setExpanded(!expanded);
  }

  if (!minHeightExpandable && !props.forceExpanded) {
    return <div ref={ref}>{props.children}</div>;
  } else {
    return (
      <div ref={ref}>
        {(expanded || props.forceExpanded) && props.children}
        {(!expanded && !props.forceExpanded) && (
          <div className={`relative overflow-hidden h-80`}>
            {props.children}
            {/* Box for hide effect at the end of the text clipped */}
            <div className="absolute bottom-0 w-full h-16 flex bg-gradient-to-t from-primary-50 via-primary-50 to-transparent"></div>
          </div>
        )}
        {!props.forceExpanded &&
          <ViewMoreOrLessButton toggleView={toggleView} expanded={expanded} />
        }
      </div>
    );
  }
}
