import * as React from 'react';
import styles from './ShoppingList.module.css'
import {useState} from "react";
import {MenuItem} from "../MainMenu";

export function ShoppingList() {

  const [list, setList] = useState<ShoppingListItem[]>([{id: 1, item_name: "Ham"}, {id: 2, item_name: "Something a little bit longer that might not fit"}])

  return (
    <div className={styles.ShoppingList}>
      {list.map((item) => (
        <MenuItem key={item.id} link={'#'} name={item.item_name}/>
      ))}
    </div>
  );
};
