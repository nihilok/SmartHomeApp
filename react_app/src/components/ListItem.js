import React, {useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon as Fa} from "@fortawesome/react-fontawesome";
import {faCheckCircle as farCheckCircle} from "@fortawesome/free-regular-svg-icons";
import {faCheckCircle} from "@fortawesome/free-solid-svg-icons";

const ListItem = ({item, deleteItem}) => {

  const [deleteIcon, setDeleteIcon] = useState(farCheckCircle);

  const itemRef = useRef(null);

  const markCompleted = () => {
    const itemContent = itemRef.current.children;
    const itemText = itemContent[0];
    itemText.style.textDecoration = 'line-through';
    setDeleteIcon(faCheckCircle);
  }

  const unMarkCompleted = () => {
    const itemContent = itemRef.current.children;
    const itemText = itemContent[0];
    itemText.style.textDecoration = 'none';
    setDeleteIcon(farCheckCircle);
  }

  const handleClick = (e) => {
    e.preventDefault();
    if (deleteIcon === farCheckCircle) {
      markCompleted();
    } else {
      unMarkCompleted();
    }
  }

  const handleDelete = (e) => {
    e.preventDefault();
    itemRef.current.style.position = 'fixed';
    itemRef.current.style.animation = 'offToTop .5s ease forwards'
    setTimeout(() => {
      deleteItem(item.id);
    }, 1000);
  }

  useEffect(()=>{
    setDeleteIcon(farCheckCircle)
    itemRef.current.scrollIntoView()
  }, [])

  return (
      <div key={'div-' + item.id} ref={itemRef}
           className="List-item flex-row-between">
        <h3 key={'h1-' + item.id} className="list-text-md">{item.text}</h3>
        <Fa key={'icon-' + item.id} icon={deleteIcon}
            onClick={handleClick} onDoubleClick={handleDelete}
            className="Delete-icon"/>
      </div>
  );
};

export default ListItem;