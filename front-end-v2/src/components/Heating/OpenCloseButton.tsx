import * as React from 'react'

interface Props {
  open: boolean;
  callback: () => void;
}

export function OpenCloseButton({open, callback}: Props) {
  return (
    <div className="close-button" onClick={callback}>{open ? <>+</> : <>&times;</>}</div>
  )
}
