import React from 'react';
import {DeleteIcon} from "./Icons";
import ListItem from "./ListItem";

export const ShoppingListBlock = ({list, deleteItem}) => {


    return (
        <div
            className="List flex-col-start">
            {list.length ? list.map((item, index) => {
                item.text = item.item_name
                return (
                    <ListItem item={item} deleteItem={deleteItem}/>
                )
            }) : <div className="text-white">Nothing here!</div>}
        </div>
    )

}
