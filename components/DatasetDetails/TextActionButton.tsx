import { MouseEventHandler, ReactNode } from "react";

interface TextActionButtonProps {
  children: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
  hidden?: boolean
  type?: "button" | "submit"
  className?: string
}

export function TextActionButton(props: TextActionButtonProps) {
  if (props.hidden) {
    return null;
  }

  return (
    <button
      type={props.type ?? "button"}
      className={`text-[13px] leading-5 font-medium text-primary-600 hover:text-primary-900 underline-offset-2 hover:underline transition-colors ${props.className ?? ""}`}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
