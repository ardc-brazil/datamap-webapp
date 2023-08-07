import Router from 'next/router';
import React from 'react'
import CloseButton from './base/CloseButton';


export default function LayoutFullScreen(props) {
  return (

    <div className="absolute w-full top-0 z-50 h-screen left-0 bg-primary-50 flex flex-col justify-center items-center">
      <div className="flex w-full h-20 px-4 py-4 items-center justify-start sticky top-0 border-b border-primary-200 bg-primary-50 scro">
        <CloseButton onClick={() => Router.back()} />
      </div>
      <div className="flex items-center justify-center w-full overflow-y-auto">
        <div className="max-w-2xl h-full">
          {props.children[0]}
        </div>
      </div>
      <div className="w-full h-24 border-t border-primary-200 sticky bottom-0 bg-primary-50 drop-shadow-lg shadow-primary-900">
        {props.children[1]}
      </div>
    </div>
  )
}
