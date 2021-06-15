import React from 'react';
import {FontAwesomeIcon as Fa} from '@fortawesome/react-fontawesome';

export const TaskBlock = ({name, tasks, DeleteFunc}) => {


  const theirTasks = tasks.filter(task => task.name === name)
  // console.log(theirTasks)

  return (<>
    <div
        className="Task-block">
      <h2>{name}</h2>
      {tasks ? theirTasks.map((task) => {
        return (
            <div key={'div-' + task.id}
                 className="List-item flex-row-between">
              <h3 key={'h1-' + task.id} className="list-text-md">{task.task}</h3>
              <Fa key={'icon-' + task.id} icon="check-circle" onDoubleClick={() => DeleteFunc(task.id, task.name)}
                  className="Delete-icon"/>
            </div>
        )
      }) : <div className="text-white">Nothing here!</div>}

    </div>

  </>)
};
