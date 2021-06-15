import React, {useEffect, useState} from 'react';
import {Header} from './Header';
import {AddNewItem} from "./AddNew";
import {AuthContext} from "../contexts/AuthContext";
import {RecipeBlock} from "./RecipeBlock";
import Loader from "./Loader";
import FetchAuthService from "../service/FetchService";


export const Recipes = () => {
  const [list, setInfo] = useState([])
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const {authState} = React.useContext(AuthContext);

  const renderRecipeCard = () => {
    return (
        <div className="Recipe-card">

          <div className="Recipe-card-inner container">
            <div className="close-button">
              <div onClick={() => {
                setCurrentRecipe(null)
              }}>&times;</div>
            </div>
            <div className="Recipe-card-content flex-col-center">
              <h1>{currentRecipe.meal_name}</h1>
              <h4>Ingredients:</h4>
              <p>{currentRecipe.ingredients}</p>
              {currentRecipe.notes ? <><h4>Notes:</h4>
                <p>{currentRecipe.notes}</p></> : ''}</div>
          </div>
        </div>
    )
  }

  useEffect(() => {
    setLoading(true)
    FetchAuthService(
        '/recipes/',
        'GET',
        authState,
        setInfo)
        .catch(e => setError(e))
        .finally(() => {
          setLoading(false)
        })
  }, [authState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItem) {
      // addItem(newItem).catch(e=>setError(e.message));
      setNewItem('');
    }
  }

  async function deleteItem(id, name) {
    await fetch(`https://server.smarthome.mjfullstack.com/recipes/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
      },
      method: 'DELETE',
      body: JSON.stringify({id})
    })
        .then(response =>
            response.json().then((data) => {
              setInfo(data)
            }));
  }

  return (
      <div className="Outer container">
        <Header text={'Recipes'} back={'/'}/>
        {loading ? <Loader classname="Loader Loader-trans"/> :
            error ? "Failed to load recipes" : <RecipeBlock list={list}
                                                            deleteItem={deleteItem}
                                                            setCurrent={setCurrentRecipe}/>}
        <AddNewItem handleSubmit={handleSubmit}
                    newItem={newItem} setNewItem={setNewItem}
                    placeholderText={"New Recipe"}
                    disabled={true}/>
        {currentRecipe ? renderRecipeCard('test') : ''}
      </div>
  )
}
;
