import React, {useEffect, useRef} from 'react';
import {useToastContext, REMOVE} from '../contexts/ToastContext';

export const ToastItem = ({t, toastDispatch, renderItem}) => {

  const toastRef = useRef(null)

  useEffect(() => {
    const removeSelf = () => {
      const toastDiv = toastRef.current
      if (toastDiv) {
        toastDiv.classList.toggle('fade-out')
        setTimeout(() => toastDispatch({type: REMOVE, payload: {id: t.id}}), 1000);
      }
    }
    setTimeout(removeSelf, 2500)
    // return () => clearTimeout(timeout)
  }, [t.id, toastDispatch])

  return (
      <div className={`toast-container-item ${t.type ? t.type : 'success'}`} key={t.id} ref={toastRef}>
        <div className="toast-text">
          {renderItem(t.content)}
        </div>
        <div
            role="img"
            aria-label="close toast"
            className="toast-close"
            onClick={() => toastDispatch({type: REMOVE, payload: {id: t.id}})}
        >
          &times;
        </div>
      </div>
  )
}

export default function Toast({toast}) {
  const {toastDispatch} = useToastContext();
  const toastContainer = useRef()

  function renderItem(content) {
    if (typeof content === 'function') {
      return content();
    } else {
      return content;
    }
  }

  return (
      <div className="toast">
        <div className="toast-container" ref={toastContainer}>
          {toast.map(t => {
            return (
                <ToastItem t={t} toastDispatch={toastDispatch} renderItem={renderItem} key={t.id}/>
            );
          })}
        </div>
      </div>
  );
}
