
interface ModalProps {
  confimButtonText: string;
  cancelButtonText?: string;
  confim?(): void;
  cancel?(): void;
  children: any;
  title: string;
  show?: Boolean
  noPaddingContent?: boolean
}

export default function Modal(props: ModalProps) {

  return (
    <>
      {props.show ? (
        <>
          <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none bg-primary-500/70"
          >
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-primary-50 outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-5 border-b border-solid border-primary-200 rounded-t">
                  <h3 className="text-3xl font-semibold">
                    {props.title}
                  </h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-primary-900 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => props.cancel()}
                  >
                    <span className="text-primary-900 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className={`relative flex-auto ${!props.noPaddingContent && `p-6`}`}>
                  <div className="my-4 text-primary-500 text-lg leading-relaxed">
                    {props.children}
                  </div>
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end p-6 border-t border-solid border-primary-200 rounded-b">
                  <button
                    className="text-primary-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => props.cancel()}
                  >
                    {!props.cancelButtonText ? "Close" : props.cancelButtonText}
                  </button>
                  {props.confim &&
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => props.confim()}
                    >
                      {props.confimButtonText}
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-primary-900"></div>
        </>
      ) : null}
    </>
  );
}