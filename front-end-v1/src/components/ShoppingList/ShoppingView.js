import React, {useEffect, useRef, useState} from 'react';
import {AddNewItem} from "../AddNew";
import {Header} from "../Header";
import FetchWithToken from "../../service/FetchService";
import {AuthContext} from "../../contexts/AuthContext";
import {useToastContext} from "../../contexts/ToastContext";
import ListItem from "./ListItem";

const ShoppingView = () => {

  const [list, setList] = useState([])
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const {authState} = React.useContext(AuthContext);
  const {toastDispatch} = useToastContext()
  const listRef = useRef(null);

  useEffect(() => {
    setLoading(true)
    FetchWithToken('/shopping/', 'GET', authState, setList)
        .catch(e => {
          setError(e)
          setList(JSON.parse(localStorage.getItem('list')))
        }).finally(() => setLoading(false))
  }, [authState]);

  useEffect(()=>{
    localStorage.setItem('list', JSON.stringify(list))
  }, [list])


  async function addItem(item_name) {
    await FetchWithToken(`/shopping/`,
        'POST',
        authState,
        setList,
        JSON.stringify({item_name}),
        toastDispatch)
        .catch(e => setError(e))
        .finally(() => {
          setLoading(false)
          if (listRef.current.scrollHeight > document.documentElement.scrollTop)
            window.scrollTo(0, listRef.current.scrollHeight)
        })
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItem) {
      addItem(newItem).catch(err => setError(err));
      setNewItem('');
    }
  }

  async function deleteItem(id) {
    setList(list.filter(x => x.id !== id))
    await FetchWithToken(`/shopping/${id}/`,
        'DELETE',
        authState,
        null,
        JSON.stringify({id}),
        toastDispatch
    )
        .catch(e => setError(e))
  }

  return (
      <div className={"Outer with-bottom-form"}>
        <Header text={'Shopping List'} back={'/'}/>
        {error && <p>{error}</p>}
        <ul ref={listRef} className={'TaskView'} style={{padding: '1rem 1rem 1rem 3rem', listStyleType: 'circle'}}>{list?.map(item => (
            <ListItem item={item} deleteItem={() => deleteItem(item.id)} key={item.id}/>
        ))}</ul>
        <AddNewItem handleSubmit={handleSubmit} newItem={newItem} setNewItem={setNewItem} placeholderText="New item"/>
      </div>
  );
};

export default ShoppingView;