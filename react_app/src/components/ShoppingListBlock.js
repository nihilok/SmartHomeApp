import React from 'react';
import ListItem from "./ListItem";

export const ShoppingListBlock = ({list, deleteItem}) => {


  return (
      <div
          className="List flex-col-start">
        {list.length ? list.map((item) => {
          item.text = item.item_name
          return (
              <ListItem item={item} deleteItem={deleteItem} key={item.id}/>
          )
        }) : <div className="text-white">Nothing here!</div>}
      </div>
  )

}
