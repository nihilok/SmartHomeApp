import React, {useEffect, useState} from 'react';
import {Header} from './Header';
import {TaskBlock} from './TaskBlock';
import {AddNewItem} from "./AddNew";
import {AuthContext} from "../contexts/AuthContext";
import Loader from "./Loader";
import FetchAuthService from "../service/FetchService";
import {useToastContext} from "../contexts/ToastContext";


const Tasks = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState({names: [], tasks: []})
  const {authState} = React.useContext(AuthContext);
  const [newTask, setNewTask] = useState('')
  const [iDState, setIDState] = useState(0)
  const {toastDispatch} = useToastContext()
  // const refObj = {}

  useEffect(() => {
        // setLoading(true)
        FetchAuthService(
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

  function arr_diff(a1, a2) {

    let a = [], diff = [];

    for (let i = 0; i < a1.length; i++) {
      a[a1[i]] = true;
    }

    for (let i = 0; i < a2.length; i++) {
      if (a[a2[i]]) {
        delete a[a2[i]];
      } else {
        a[a2[i]] = true;
      }
    }

    for (let k in a) {
      diff.push(k);
    }

    return diff;
  }

  async function addTask(hm_id, task) {
    // const taskCheck = tasks
    await FetchAuthService(
        `/tasks/`,
        'POST',
        authState,
        setTasks,
        JSON.stringify({hm_id, task}),
        toastDispatch)
    // const diff = arr_diff(taskCheck.tasks, tasks.tasks)
    // if (diff) {
    //   console.log(diff)
    //   for (let i = 0; i < diff.length; i++) {
    //     console.log(diff[i].name)
    //   }
    // }

  }

  async function markComplete(task_id) {
    await FetchAuthService(
        `/tasks/${task_id}/`,
        'POST',
        authState,
        setTasks,
        null,
        toastDispatch)
        .catch(e => setError(e))
  }

  async function deleteTask(id, name) {
    setTasks(prevTasks => ({
      ...prevTasks,
      name: tasks.tasks.filter(x => x.id !== id)
    }))
    await FetchAuthService(
        `/tasks/${id}/`,
        'DELETE',
        authState,
        setTasks,
        JSON.stringify({id}),
        toastDispatch)
        .catch(e => setError(e))
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTask) {
      addTask(iDState, newTask);
      setNewTask('');
    }
  }


  return <div className="Outer">
    <Header text={'Tasks'} back={'/'}/>
    <div className="container">
      {error ? "Failed to load tasks; are you authorised to view them?" : loading ?

          <Loader classname="Loader Loader-trans"/> :

          <div className="Task-blocks">
            {tasks ? tasks.names.map((name) => {
              return (

                  <div className="Task-block flex-col-center" key={name + 'mb'}>
                    <TaskBlock name={name[1]} tasks={tasks.tasks} key={name + 'tb'} DeleteFunc={deleteTask}
                               AddFunc={addTask} markComplete={markComplete}/>
                  </div>
              )
            }) : ''}</div>}

      <AddNewItem handleSubmit={handleSubmit} newItem={newTask} setNewItem={setNewTask}
                  placeholderText={"New Task"} options={tasks.names} setID={setIDState}/></div>
  </div>

}

export default Tasks;