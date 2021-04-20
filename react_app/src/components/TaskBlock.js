import React, {useState} from 'react';
import {FontAwesomeIcon as Fa} from '@fortawesome/react-fontawesome';
import {AddNewItem} from "./AddNew";

export const TaskBlock = ({name, tasks, DeleteFunc, AddFunc}) => {

    const [newTask, setNewTask] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newTask) {
            AddFunc(name, newTask);
            setNewTask('');
        }
    }

    return (<>
        <div
            className="taskBlock max-h-96 overflow-y-auto">
            {tasks.length ? tasks.map((task, index) => {
                return (
                    <div key={'div' + index}
                         className="task pt-1">
                        <h1 key={'h1' + index} className="font-semibold ml-2 pt-1">{task[1]}</h1>
                        <Fa key={'icon' + index} icon="check-circle" onDoubleClick={() => DeleteFunc(task[0])}
                            className="deleteIcon mt-1"/>
                    </div>
                )
            }) : <div className="text-white">Nothing here!</div>}

        </div>
        <AddNewItem handleSubmit={handleSubmit} newItem={newTask} setNewItem={setNewTask}/>
    </>)
};
