import React, {useEffect, useState} from 'react';
import {Header} from "../Header";
import {AddNewItem} from "../AddNew";
import FetchWithToken from "../../service/FetchService";
import {AuthContext} from "../../contexts/AuthContext";
import {useToastContext} from "../../contexts/ToastContext";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

const TaskPanel = ({children, value, index, ...other}) => {
return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
        style={{padding: '1rem'}}
    >
      {value === index && (
          <div>{children}</div>
      )}
    </div>
  );
}

const TaskView = () => {

  const [loading, setLoading] = useState('')
  const [newTask, setNewTask] = useState('')
  const [person, setPerson] = useState(0)
  const [tasks, setTasks] = useState({names: [], tasks: []})
  const [error, setError] = useState(null)
  const {authState} = React.useContext(AuthContext);
  const {toastDispatch} = useToastContext()

  useEffect(() => {
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

  async function addTask(evt) {
    evt.preventDefault()
    await FetchWithToken(
        `/tasks/`,
        'POST',
        authState,
        setTasks,
        JSON.stringify({hm_id:person, task:newTask}),
        toastDispatch)
  }

  async function markComplete(task_id) {
    await FetchWithToken(
        `/tasks/${task_id}/`,
        'POST',
        authState,
        setTasks,
        null,
        null)
        .catch(e => setError(e))
  }

  async function deleteTask(id) {
    setTasks(prevTasks => ({
      ...prevTasks,
      tasks: prevTasks.tasks.filter(x => x.id !== id)
    }))
    await FetchWithToken(
        `/tasks/${id}/`,
        'DELETE',
        authState,
        setTasks,
        JSON.stringify({id}),
        toastDispatch)
        .catch(e => setError(e))
  }

  const [tabValue, setTabValue] = useState(0)
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
      <div className={'Outer'}>
        <Header text={'Tasks'} back={'/'}/>
        <div className={'TaskView'}><Tabs variant={'fullWidth'} value={tabValue} onChange={handleTabChange}>{!loading ? tasks?.names.map((name, index) => (
            <Tab value={index} key={name + 'tab'} label={name[1]}/>
        )) : ''}</Tabs>
        {!loading ? tasks?.names.map((name, index) => (
            <TaskPanel value={tabValue} index={index} key={name + 'panel'}>
              {tasks.tasks.filter(task => task.name === name[1]).map(task => (
                  <div className={'task'} key={task.id} onDoubleClick={()=>deleteTask(task.id)}>{task.task}</div>
              ))}
            </TaskPanel>
        )) : ''}

        <AddNewItem
            handleSubmit={addTask}
            newItem={newTask}
            setNewItem={setNewTask}
            placeholderText={"New Task"}
            options={tasks.names}
            setID={setPerson}/>
      </div></div>
  );
};

export default TaskView;