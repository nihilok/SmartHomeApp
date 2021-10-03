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
  const itemRef = useRef(null);

  useEffect(() => {
    setLoading(true)
    FetchWithToken('/shopping/', 'GET', authState, setList)
        .catch(e => setError(e)).finally(() => setLoading(false))
        .finally(() => setLoading(false))
  }, [authState]);


  async function addItem(item_name) {
    await FetchWithToken(`/shopping/`,
        'POST',
        authState,
        setList,
        JSON.stringify({item_name}),
        toastDispatch)
        .catch(e => setError(e))
        .finally(() => setLoading(false))
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItem) {
      addItem(newItem).catch();
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
      <div className={"Outer"}>
        <Header text={'Shopping List'} back={'/'}/>
        <ul className={'TaskView'} style={{padding: '1rem 1rem 1rem 3rem', listStyleType: 'circle'}}>{list?.map(item => (
            <ListItem item={item} deleteItem={() => deleteItem(item.id)}/>
        ))}</ul>
        <AddNewItem handleSubmit={handleSubmit} newItem={newItem} setNewItem={setNewItem} placeholderText="New item"/>
      </div>
  );
};

export default ShoppingView;