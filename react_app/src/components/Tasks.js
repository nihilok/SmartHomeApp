import React, {useEffect, useState} from 'react';
import {Header} from './Header';
import {TaskBlock} from './TaskBlock';
import {AddNewItem} from "./AddNew";

export const Tasks = () => {
    const names = ['Les', 'Mike']
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState([])

    async function GetTasks() {
        try {
            setLoading(true);
            return await fetch(`https://server.smarthome.mjfullstack.com/tasks`,{
                headers: {
                'Content-Type': 'application/json'
            },
                method: 'GET'
            }).then(response =>
                response.json().then((data) => {
                    setTasks(data)
                }));
        } catch (e) {
            setError(e);
        } finally {
            setTimeout(() => {setLoading(false)}, 400);
        }
    }

    async function addTask(name, task) {
        await fetch(`https://server.smarthome.mjfullstack.com/tasks`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({name, task})
        })
            .then(response =>
                response.json().then((data) => {
                    setTasks(data)
                }));
    }

    async function deleteTask(id) {
        await fetch(`https://server.smarthome.mjfullstack.com/tasks/${id}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'DELETE',
            body: JSON.stringify({id})
        })
            .then(response =>
                response.json().then((data) => {
                    setTasks(data)
                }));
    }

    useEffect(() => {
        GetTasks();
    }, []);

    if (error) return "Failed to load tasks: " + error.message;
    return <div className="max-h-screen w-screen overflow-hidden">
        <Header text={'Tasks'} back={true}/>
        <hr className="mt-5"/>
        <div className="flex flex-row h-full justify-center">
            {names.map((name) => {
                return (
                    <div className="flex flex-col justify-start items-center w-full mt-5">

                            <div className="font-bold text-white text-4xl">{name}</div>
                            {loading ? <div className="centerCol w-full"><div className="lds-ellipsis">
                                <div/>
                                <div/>
                                <div/>
                                <div/>
                            </div>
                            <AddNewItem newItem={addTask} /></div> : <TaskBlock name={name} tasks={tasks[name]} DeleteFunc={deleteTask} AddFunc={addTask}/>}
                    </div>
                )
            })}
        </div>
    </div>
}