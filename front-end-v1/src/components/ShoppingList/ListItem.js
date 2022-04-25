import React, {useRef, useState} from 'react';

const ListItem = ({item, deleteItem}) => {

  const itemRef = useRef(null);
  const [completed, setCompleted] = useState(false);
  const timeout = useRef(null);

  function markCompleted() {
    const itemText = itemRef.current;
    if (itemText) {
      itemText.style.textDecoration = 'line-through';
      setCompleted(true);
    }
  }

  function undoMarkCompleted() {
    const itemText = itemRef.current;
    if (itemText) {
      itemText.style.textDecoration = 'none';
      setCompleted(false);
    }
  }

  const handleUndo = () => {
    timeout.current = setTimeout(undoMarkCompleted, 500);
  }

  function handleDelete() {
    clearTimeout(timeout.current);
    setTimeout(deleteItem, 100);
  }


  return (
      <li className={'task'} ref={itemRef}
           onClick={!completed ? markCompleted : handleUndo}
           onDoubleClick={handleDelete}>
        {item.item_name}
      </li>
  );
};

export default ListItem;