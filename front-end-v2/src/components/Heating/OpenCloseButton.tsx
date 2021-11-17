import * as React from 'react'

interface Props {
  open: boolean;
  closeFunc: () => void;
}

export function OpenCloseButton({open, closeFunc}: Props) {
  return (
    <div className="close-button" onClick={closeFunc}>{open ? <>+</> : <>&times;</>}</div>
  )
}
