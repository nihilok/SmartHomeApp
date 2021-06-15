import React from 'react';
import {ADD, useToastContext} from "../contexts/ToastContext";
import {FontAwesomeIcon as Fa} from '@fortawesome/react-fontawesome';
import { faStickyNote as farStickyNote } from '@fortawesome/free-regular-svg-icons'


export const RecipeBlock = ({list, deleteItem, setCurrent}) => {

    const showNotes = (recipe) => {
        setCurrent(recipe)
    }

    return (
        <div
            className="List flex-col-start">
            {list.length ? list.map((item, index) => {
                return (
                    <div key={'div' + item.id} onClick={() => showNotes(item)}
                         className="List-item Recipe flex-row-between">
                        <div className={""}>
                            <h1 key={'h1' + item.id} className="text-2xl ml-2">{item.meal_name}</h1>
                            <h6 key={'h6' + item.id} className="ml-2">{item.ingredients}</h6></div>
                        {/*<Fa key={'icon' + index} icon="check-circle" onDoubleClick={() => deleteItem(item.id)}*/}
                        {/*    className="deleteIcon"/>*/}
                        {item.notes ? <Fa key={'icon' + item.id} icon={farStickyNote} className="fa-2x"/> : ''}
                    </div>
                )
            }) : <div className="text-white">Nothing here!</div>}
                </div>
                )

            }
