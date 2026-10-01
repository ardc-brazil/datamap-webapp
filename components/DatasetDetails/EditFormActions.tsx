import { MouseEventHandler } from "react";

interface EditFormActionsProps {
  onCancel: MouseEventHandler<HTMLButtonElement>
  onSave?: MouseEventHandler<HTMLButtonElement>
  isSubmitting?: boolean
  className?: string
}

export function EditFormActions(props: EditFormActionsProps) {
  return (
    <div className={props.className ?? "flex justify-end gap-2 pt-4"}>
      <button
        type="button"
        className="h-9 px-3.5 rounded-md border border-primary-300 bg-primary-0 text-primary-900 text-[13px] font-semibold whitespace-nowrap hover:bg-primary-100 transition-colors"
        onClick={props.onCancel}
      >
        Cancel
      </button>
      <button
        type={props.onSave ? "button" : "submit"}
        className="h-9 px-3.5 rounded-md bg-primary-900 text-primary-50 text-[13px] font-semibold whitespace-nowrap hover:bg-primary-800 transition-colors disabled:opacity-50"
        disabled={props.isSubmitting}
        onClick={props.onSave}
      >
        Save
      </button>
    </div>
  );
}
