import React, {useState} from 'react';
import {Header} from "../Header";
import {AddNewItem} from "../AddNew";

const TaskView = () => {

  const [newTask, setNewTask] = useState('')
  const [person, setPerson] = useState(0)
  const [tasks, setTasks] = useState(null)

  const addTask = () => {

  }

  const deleteTask = () => {

  }

  const markCompleted = () => {

  }

  return (
      <div className={'Outer'}>
        <Header text={'Tasks'} back={'/'}/>
        <AddNewItem
            handleSubmit={addTask}
            newItem={newTask}
            setNewItem={setNewTask}
            placeholderText={"New Task"}
            options={tasks.names}
            setID={setPerson}/>
      </div>
  );
};

export default TaskView;