import React from 'react';
import {FontAwesomeIcon as Fa} from '@fortawesome/react-fontawesome';

export const ShoppingListBlock = ({list, deleteItem}) => {


    return (
        <div className="overflow-y-auto" style={{
            maxHeight: "50vh"
        }}>
            <div
                className="flex flex-col justify-start items-center px-2 space-y-2 divide-y pt-5">
                {list.length ? list.map((item, index) => {
                    return (
                        <div key={'div' + index}
                             className="task pt-1">
                            <h1 key={'h1' + index} className="text-2xl ml-2">{item.item_name}</h1>
                            <Fa key={'icon' + index} icon="check-circle" onDoubleClick={() => deleteItem(item.id)}
                                className="deleteIcon"/>
                        </div>
                    )
                }) : <div className="text-white">Nothing here!</div>}
            </div>
        </div>
    )

}
