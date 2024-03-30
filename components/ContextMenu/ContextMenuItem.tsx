
export function ContextMenuItem(props: any) {
  return (
    <div className="py-3 hover:bg-primary-200 cursor-pointer px-2 my-1" onClick={props.onClick}>
      <div className="inline-block px-2">
        {props.children}
      </div> {props.text}
    </div>
  );
}