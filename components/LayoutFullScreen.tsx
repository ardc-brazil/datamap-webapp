import Router from 'next/router';
import React from 'react'
import { MaterialSymbol } from 'react-material-symbols';
import { Logo } from './Brand/Logo';

interface LayoutFullScreenProps {
  children: React.ReactNode[]
  title?: string
  hint?: string
}

export default function LayoutFullScreen(props: LayoutFullScreenProps) {
  return (
    <div className="absolute h-screen w-full top-0 z-50 left-0 bg-primary-50 flex flex-col justify-start overflow-hidden">
      <div className="flex flex-none w-full h-16 px-6 items-center justify-between gap-4 border-b border-primary-200 bg-primary-50">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            aria-label="Close"
            className="flex flex-none items-center justify-center w-8 h-8 rounded-md border border-primary-300 bg-primary-0 text-primary-700 hover:bg-primary-100 transition-colors"
            onClick={() => Router.back()}
          >
            <MaterialSymbol icon="close" size={20} grade={-25} weight={400} />
          </button>
          {props.title &&
            <span className="text-sm font-semibold text-primary-900 whitespace-nowrap">{props.title}</span>
          }
          {props.hint &&
            <span className="hidden sm:inline text-[13px] text-primary-400 truncate">{props.hint}</span>
          }
        </div>
        <Logo size="sm" />
      </div>
      <div className="flex-1 min-h-0 w-full overflow-y-auto">
        <div className="mx-auto w-full max-w-[640px] px-4 sm:px-0 pt-14 pb-16">
          {props.children[0]}
        </div>
      </div>
      <div className="flex-none w-full h-[72px] border-t border-primary-200 bg-primary-50">
        {props.children[1]}
      </div>
    </div>
  )
}
