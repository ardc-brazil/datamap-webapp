import useComponentVisible from "../../hooks/UseComponentVisible";


export function ContextMenuButton(props: any) {

  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  function handleDataFilesButtonClick(event): void {
    setIsComponentVisible(true);
  }

  return (
    <div className="relative flex justify-end">
      <button type="button" className="btn-primary-outline-basic rounded-full text-2xl text-center font-extrabold w-12 h-12" onClick={handleDataFilesButtonClick}>
        &#8942;
      </button>

      <div ref={ref} className={`${!isComponentVisible && "hidden"} absolute top-12 bg-primary-50 w-full border border-primary-200 shadow shadow-primary-300 rounded-md py-2 w-96 `}>
        {props.children}
      </div>

    </div>
  );
}