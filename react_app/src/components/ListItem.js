import React, {useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon as Fa} from "@fortawesome/react-fontawesome";
import {faCheckCircle as farCheckCircle} from "@fortawesome/free-regular-svg-icons";
import {faCheckCircle} from "@fortawesome/free-solid-svg-icons";

const ListItem = ({item, deleteItem, markComplete}) => {
  const [deleteIcon, setDeleteIcon] = useState(farCheckCircle);
  const [completed, setCompleted] = useState(item.completed ? item.completed : false);
  const [clicked, setClicked] = useState(false)
  const itemRef = useRef(null);
  const timeout = useRef(null);

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
    if (clicked) {
      return handleDelete()
    }
    if (markComplete) {
      markCompleted()
      markComplete(item.id);
    }
    if (!clicked) {
      setClicked(true)
      if (!completed) {
        markCompleted();
        setCompleted(true)
      } else {
        unMarkCompleted();
        setCompleted(false)
      }
    }
    timeout.current = setTimeout(() => setClicked(false), 500)
  }

  const handleDelete = () => {
    clearTimeout(timeout.current)
    itemRef.current.style.position = 'fixed';
    itemRef.current.style.top = '65%';
    itemRef.current.style.left = '10%';
    itemRef.current.style.animation = 'offToTop .5s ease forwards'
    setTimeout(() => {
      deleteItem(item.id);
    }, 1000);
    setClicked(false);
  }

  useEffect(() => {
    setDeleteIcon(farCheckCircle)
    itemRef.current.scrollIntoView()
    if (completed) {
      markCompleted();
    }
  }, [completed])

  return (
      <div key={'div-' + item.id} ref={itemRef}
           className="List-item flex-row-between">
        <h3 key={'h1-' + item.id} className={completed ? "list-text-md completed" : "list-text-md"}>{item.text}</h3>
        <Fa key={'icon-' + item.id} icon={deleteIcon}
            onClick={handleClick}
            className="Delete-icon"/>
      </div>
  );
};

export default ListItem;