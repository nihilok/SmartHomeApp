import React, {useEffect, useState} from 'react';
import {Header} from "../Header";
import {AddNewItem} from "../AddNew";
import FetchWithToken from "../../service/FetchService";
import {AuthContext} from "../../contexts/AuthContext";
import {useToastContext} from "../../contexts/ToastContext";

const TaskView = () => {

  const [loading, setLoading] = useState('')
  const [newTask, setNewTask] = useState('')
  const [person, setPerson] = useState(0)
  const [tasks, setTasks] = useState(null)
  const {authState} = React.useContext(AuthContext);
  const {toastDispatch} = useToastContext()

  useEffect(() => {
        // setLoading(true)
        FetchWithToken(
            '/tasks/',
            'GET',
            authState,
            setTasks)
            .catch(e => setError(e))
            .finally(() => {
              setLoading(false)
            })
      }, [authState]
  );

  async function addTask() {
    await FetchWithToken(
        `/tasks/`,
        'POST',
        setTasks,
        JSON.stringify({hm_id:person, task:newTask}),
        toastDispatch)
  }

  async function markComplete(task_id) {
    await FetchWithToken(
        `/tasks/${task_id}/`,
        'POST',
        setTasks,
        null,
        null)
        .catch(e => setError(e))
  }

  async function deleteTask(id, name) {
    setTasks(prevTasks => ({
      ...prevTasks,
      name: tasks.tasks.filter(x => x.id !== id)
    }))
    await FetchWithToken(
        `/tasks/${id}/`,
        'DELETE',
        setTasks,
        JSON.stringify({id}),
        toastDispatch)
        .catch(e => setError(e))
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