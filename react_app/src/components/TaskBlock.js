import React from 'react';
import {FontAwesomeIcon as Fa} from '@fortawesome/react-fontawesome';
import Task from "./Task";
import ListItem from "./ListItem";

export const TaskBlock = ({name, tasks, DeleteFunc}) => {


  const theirTasks = tasks.filter(task => task.name === name)
  // console.log(theirTasks)

  return (<>
    <div
        className="Task-block">
      <h2>{name}</h2>
      {theirTasks ? theirTasks.map((task) => {
        task.text = task.task
        return (
            <ListItem item={task} deleteItem={DeleteFunc}/>
        )
      }) : <div className="text-white">Nothing here!</div>}

    </div>

  </>)
};
