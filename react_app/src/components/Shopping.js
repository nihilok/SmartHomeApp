import React, {useEffect, useState} from 'react';
import {Header} from './Header';
import {ShoppingListBlock} from "./ShoppingListBlock";
import {AddNewItem} from "./AddNew";

export const Shopping = () => {
    const [list, setInfo] = useState([])
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true)
    const [newItem, setNewItem] = useState('')

    async function GetInfo() {
        try {
            setLoading(true);
            await fetch(`https://server.smarthome.mjfullstack.com/shopping/`, {
                headers: {
                'Content-Type': 'application/json'
            },
                method: 'GET'
            }).then(response =>
                response.json().then((data) => {
                    setInfo(data);

                }));
        } catch (e) {
            setError(e);
        } finally {
            setTimeout(() => {
                        setLoading(false);
                    }, 500)
        }
    }

    async function addItem(item_name) {
        await fetch(`https://server.smarthome.mjfullstack.com/shopping/`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({item_name})
        })
            .then(response =>
                response.json().then((data) => {
                    setInfo(data);
                }));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newItem) {
            addItem(newItem);
            setNewItem('');

        }
    }

    async function deleteItem(id, name) {
        await fetch(`https://server.smarthome.mjfullstack.com/shopping/${id}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'DELETE',
            body: JSON.stringify({id})
        })
            .then(response =>
                response.json().then((data) => {
                    setInfo(data)
                }));
    }

    useEffect(() => {
        GetInfo();

    }, [setLoading]);

    if (error) return "Failed to load shopping list";
    return (
        <div className="max-h-screen max-w-screen">
            <Header text={'Shopping List'} back={true}/>
            <hr className="mt-5"/>
            {loading ? <div className="centerCol w-full">
                    <div className="lds-ellipsis">
                        <div/>
                        <div/>
                        <div/>
                        <div/>
                    </div>
                </div> :
                <ShoppingListBlock list={list} deleteItem={deleteItem}/>}
            <AddNewItem handleSubmit={handleSubmit} newItem={newItem} setNewItem={setNewItem}/>
        </div>
    );
}
;