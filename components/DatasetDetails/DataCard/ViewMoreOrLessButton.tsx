export function ViewMoreOrLessButton(props) {
  return (
    <button
      className="btn-primary-outline btn-small whitespace-nowrap rounded-3xl border-0"
      onClick={props.toggleView}
    >
      <svg
        aria-hidden="true"
        className={`${props.expanded ? "-rotate-90" : "rotate-90"} w-3 h-3 inline-block mx-1`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        ></path>
      </svg>

      {!props.expanded && "View more"}
      {props.expanded && "View less"}
    </button>
  );
}
