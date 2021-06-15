import React from 'react';
import {DeleteIcon} from "./Icons";

export const ShoppingListBlock = ({list, deleteItem}) => {


    return (
        <div
            className="List flex-col-start">
            {list.length ? list.map((item, index) => {
                return (
                    <div key={'div' + index}
                         className="List-item flex-row-between">
                        <h2 key={'h1' + index} className="text-2xl ml-2">{item.item_name}</h2>
                        <DeleteIcon key={'icon' + index} icon="check-circle" func={deleteItem} id={item.id}
                            className="Delete-icon"/>
                    </div>
                )
            }) : <div className="text-white">Nothing here!</div>}
        </div>
    )

}
