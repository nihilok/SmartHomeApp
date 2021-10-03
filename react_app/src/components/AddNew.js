import React, {useRef} from 'react';
import {ADD, useToastContext} from "../contexts/ToastContext";


export const AddNewItem = ({handleSubmit, newItem, setNewItem, placeholderText, options, setID, disabled}) => {

    const {toastDispatch} = useToastContext()
    const inputRef = useRef(null)

    const handleOptionChange = (e) => {
        const val = e.target.value
        setID(val);
    }

    const fakeSubmit = (e) => {
        e.preventDefault();
        toastDispatch({
            type: ADD,
            payload: {
                content: 'This feature is not currently supported',
                type: 'danger'
            }
        });
    }

    function onSubmit(evt) {
        inputRef.current.blur()
        handleSubmit(evt)
    }

    return (
        <form onSubmit={!disabled ? onSubmit : fakeSubmit} className="Add-item on-from-bottom">
            {options ? <div className="Option-radios">{options.map((name) => <label htmlFor={name[0] + 'Radio'} key={name[0]+'rad'}
                                                                          className="Radio-container">{name[1]}<input
                type="radio" id={name[0] + 'Radio'}
                key={name[0]+'rad'}
                name="name" value={name[0]} required
                onChange={handleOptionChange}/><span
                className="checkmark"/></label>)}</div> : ''}
            <input type="text"
                   ref={inputRef}
                   onChange={e => setNewItem(e.target.value)}
                   value={newItem}
                   placeholder={placeholderText}/>
        </form>
    );
};
