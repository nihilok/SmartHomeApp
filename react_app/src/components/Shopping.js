import React, {useEffect, useState} from 'react';
import {Header} from './Header';
import {ShoppingListBlock} from "./ShoppingListBlock";
import {AddNewItem} from "./AddNew";
import {AuthContext} from "../contexts/AuthContext";
import Loader from "./Loader";
import FetchWithToken from "../service/FetchService";
import {useToastContext} from "../contexts/ToastContext";

const Shopping = () => {
  const [list, setList] = useState([])
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const {authState} = React.useContext(AuthContext);
  const {toastDispatch} = useToastContext()

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
        .finally(()=>setLoading(false))
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
        setList,
        JSON.stringify({id}),
        toastDispatch
    )
        .catch(e => setError(e))
  }


  return (
      <div className="Outer container">
        <Header text={'Shopping List'} back={'/'}/>
        {loading ? <Loader classname="Loader Loader-trans"/> :
            error ? "Failed to load shopping list" : <ShoppingListBlock list={list} deleteItem={deleteItem}/>}
        <AddNewItem handleSubmit={handleSubmit} newItem={newItem} setNewItem={setNewItem} placeholderText="New item"/>
      </div>
  );
};


export default Shopping;