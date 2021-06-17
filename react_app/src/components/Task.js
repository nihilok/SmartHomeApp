import React, {useRef, useState} from 'react';
import {FontAwesomeIcon as Fa} from "@fortawesome/react-fontawesome";
import {faCheckCircle as farCheckCircle} from "@fortawesome/free-regular-svg-icons";
import {faCheckCircle} from "@fortawesome/free-solid-svg-icons";

const Task = ({task, deleteFunc}) => {

  const [deleteIcon, setDeleteIcon] = useState(farCheckCircle);

  const taskRef = useRef(null);

  const markCompleted = () => {
    const taskContent = taskRef.current.children;
    const taskText = taskContent[0];
    taskText.style.textDecoration = 'line-through';
    setDeleteIcon(faCheckCircle);
  }

  const unMarkCompleted = () => {
    const taskContent = taskRef.current.children;
    const taskText = taskContent[0];
    taskText.style.textDecoration = 'none';
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
    taskRef.current.style.animation = 'offToTop 1s ease forwards'
    setTimeout(() => {
      deleteFunc(task.id, task.name);
    }, 1000);
  }

  return (
      <div key={'div-' + task.id} ref={taskRef}
           className="List-item flex-row-between">
        <h3 key={'h1-' + task.id} className="list-text-md">{task.task}</h3>
        <Fa key={'icon-' + task.id} icon={deleteIcon}
            onClick={handleClick} onDoubleClick={handleDelete}
            className="Delete-icon"/>
      </div>
  );
};

export default Task;