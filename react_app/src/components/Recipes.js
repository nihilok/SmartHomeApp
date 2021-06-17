import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Header} from './Header';
import {AuthContext} from "../contexts/AuthContext";
import {RecipeBlock} from "./RecipeBlock";
import Loader from "./Loader";
import FetchAuthService from "../service/FetchService";
import PlusButton from "./PlusButton";
import {useInput} from "../hooks/input-hook";
import AreYouSure from "./AreYouSure";
import {useToastContext} from "../contexts/ToastContext";

export const Recipes = () => {
      const [list, setInfo] = useState([])
      const [error, setError] = useState(null);
      const [loading, setLoading] = useState(true)
      // const [newItem, setNewItem] = useState('')
      const [currentRecipe, setCurrentRecipe] = useState(null)
      const [newRecipe, setNewRecipe] = useState(false)
      const [editing, setEditing] = useState(false)
      const {value: meal_name, setValue: setMealName, bind: bindMealName, reset: resetMealName} = useInput('');
      const {value: ingredients, setValue: setIngredients, bind: bindIngredients, reset: resetIngredients} = useInput('');
      const {value: notes, setValue: setNotes, bind: bindNotes, reset: resetNotes} = useInput('');
      const {authState} = React.useContext(AuthContext);
      const [sure, setSure] = useState(false)
      const recipeRef = useRef(null)
      const {toastDispatch} = useToastContext()

      const handleEdit = () => {
        setEditing(true)
        recipeRef.current = currentRecipe
        setMealName(recipeRef.current.meal_name)
        setIngredients(recipeRef.current.ingredients)
        setNotes(recipeRef.current.notes)
        setNewRecipe(true)
      }

      const renderRecipeCard = () => {
        return (

            <div className="Recipe-card" onClick={() => setCurrentRecipe(null)}>

              <div className="note on-from-bottom">
                <div className="note-top">
                  <div><h1>{currentRecipe.meal_name}</h1></div>
                  <div/>
                </div>

                <div className="note-bottom">
                  <div className="Recipe-card-content">

                    <h4>Ingredients:</h4>
                    <p>{currentRecipe.ingredients}</p>
                    {currentRecipe.notes ? <><h4>Notes:</h4>
                      <p>{currentRecipe.notes}</p></> : ''}</div>
                  <div className="remove-recipe">
                    <div onClick={handleEdit}>Edit Recipe</div>
                    <div onClick={handleDelete}>Remove Recipe</div>
                  </div>
                </div>
              </div>
            </div>
        )
      }

      const getRecipes = useCallback(() => {
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
      }, [authState])

      useEffect(() => {
        getRecipes();
      }, [getRecipes]);

      const handleSubmit = (e) => {
        console.log(editing)
        console.log(editing)
        e.preventDefault();
        const data = {
          meal_name,
          ingredients,
          notes
        }
        setLoading(true)
        if (editing) {
          editItem(data)
              .catch(e => setError(e))
              .finally(() => {
                setLoading(false)
                setEditing(false)
              })
        } else {
          addItem(data)
              .catch(e => setError(e))
              .finally(() => {
                setLoading(false)
              })
        }
        resetMealName()
        resetIngredients()
        resetNotes()
        // getRecipes()
        setNewRecipe(false)
        recipeRef.current = null
      }

      async function addItem(data) {
        FetchAuthService(
            '/recipes/',
            'POST',
            authState,
            setInfo,
            JSON.stringify(data))
            .catch(e => setError(e))
            .finally(() => {
              setLoading(false)
            })
      }

      async function deleteItem() {
        FetchAuthService(
            `/recipes/${recipeRef.current.id}/`,
            'DELETE',
            authState,
            setInfo,
            JSON.stringify({id: recipeRef.current.id}),
            toastDispatch)
            .catch(e => setError(e))
            .finally(() => {
              setLoading(false)
            })
        recipeRef.current = null
      }

      async function editItem(data) {
        FetchAuthService(
            `/recipes/${recipeRef.current.id}/`,
            'POST',
            authState,
            setInfo,
            JSON.stringify(data),
            toastDispatch)
            .catch(e => setError(e))
            .finally(() => {
              setLoading(false)
            })
      }

      const handleDelete = () => {
        recipeRef.current = currentRecipe
        setSure(true)
      }

      const renderNewRecipeForm = () => {
        return (
            <div className="Recipe-card">

              <div className="note on-from-bottom">
                <div className="close-button" onClick={() => {
                  setNewRecipe(false);
                  setEditing(false)
                  resetMealName()
                  resetIngredients()
                  resetNotes()
                  recipeRef.current = null
                }}>&times;</div>

                <div className="note-top">
                  <div><h1>{meal_name ? 'Edit' : 'Add a'} Recipe..</h1></div>
                  <div/>
                </div>

                <div className="note-bottom">
                  <div className="Recipe-card-content">
                    <form className="New-recipe flex-col-center" onSubmit={handleSubmit}>
                      <div className="form-control"><input type="text" placeholder="Meal Name" {...bindMealName} required/>
                      </div>
                      <div className="form-control"><textarea placeholder="Ingredients" {...bindIngredients} required/>
                      </div>
                      <div className="form-control"><textarea placeholder="Notes" {...bindNotes}/></div>
                      <input type="submit" value="Save" className="btn-outline"/>
                    </form>
                  </div>
                </div>
              </div>
            </div>
        )
      }

      return (
          <div className="Outer container">
            <Header text={'Recipes'} back={'/'}/>
            {loading ? <Loader classname="Loader Loader-trans"/> :
                error ? "Failed to load recipes" : <RecipeBlock list={list}
                                                                deleteItem={deleteItem}
                                                                setCurrent={setCurrentRecipe}/>}
            <nav className="plus-button">
              <PlusButton callback={() => setNewRecipe(true)}/>
            </nav>
            {currentRecipe ? renderRecipeCard() :
                newRecipe ? renderNewRecipeForm() : ''}

            {sure ? <AreYouSure callback={deleteItem} setShown={setSure}/> : ''}

          </div>
      )
    }
;

export default Recipes;