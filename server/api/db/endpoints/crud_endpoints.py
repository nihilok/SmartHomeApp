from typing import List

from fastapi import Depends, APIRouter
from pydantic import BaseModel

from ... import authentication
from ...authentication import get_current_user, get_current_active_user
from ..models import Task, TaskPydanticIn, \
    ShoppingListItem, ShoppingListItemPydantic, ShoppingListItemPydanticIn, \
    Recipe, RecipePydantic, RecipePydanticIn, \
    HouseholdMember, HouseholdMemberPydantic


router = APIRouter()


class TaskResponseSingle(BaseModel):
    id: int
    name: str
    task: str
    completed: bool


class TasksResponse(BaseModel):
    names: List[tuple]
    tasks: List[TaskResponseSingle]


# Tasks endpoints
async def parse_tasks() -> TasksResponse:
    tasks = await Task.all()
    hms = await HouseholdMember.all()
    names = dict(zip([hm.id for hm in hms if hm.id not in authentication.GUEST_IDS], [(hm.id, hm.name) for hm in hms]))
    resp = []
    for task in tasks:
        resp.append(TaskResponseSingle(id=task.id, name=names[task.hm_id][1], task=task.task, completed=task.completed))
    return TasksResponse(names=list(names.values()), tasks=resp)


@router.get('/tasks/')
async def get_tasks(user: HouseholdMemberPydantic = Depends(get_current_user)):
    return await parse_tasks()


@router.post('/tasks/')
async def add_task(task: TaskPydanticIn, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await Task.create(**task.dict(exclude_unset=True))
    return await parse_tasks()


@router.delete('/tasks/{id}/')
async def delete_task(id: int, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await Task.filter(id=id).delete()
    return await get_tasks()


@router.post('/tasks/{id}/')
async def mark_completed(id: int, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    task_obj = await Task.get(id=id)
    task_obj.completed = True if not task_obj.completed else False
    await task_obj.save()
    return await get_tasks()


# Shopping list endpoints
@router.get('/shopping/')
async def get_shopping_list():
    return await ShoppingListItemPydantic.from_queryset(ShoppingListItem.all().order_by('id'))


@router.post('/shopping/')
async def add_shopping_item(item: ShoppingListItemPydanticIn,
                            user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    try:
        await ShoppingListItem.create(**item.dict(exclude_unset=True))
    finally:
        return await get_shopping_list()


@router.delete('/shopping/{item_id}/')
async def delete_shopping_item(item_id: int, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await ShoppingListItem.filter(id=item_id).delete()
    return await get_shopping_list()


# Recipe endpoints
@router.get('/recipes/')
async def get_recipes():
    return await RecipePydantic.from_queryset(Recipe.all())


@router.post('/recipes/')
async def add_recipe(recipe: RecipePydanticIn, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await Recipe.create(**recipe.dict(exclude_unset=True))
    return await get_recipes()


@router.get('/recipes/{recipe_id}/')
async def get_recipe(recipe_id: int, user: HouseholdMemberPydantic = Depends(get_current_user)):
    return await RecipePydantic.from_queryset_single(Recipe.get(id=recipe_id))


@router.post('/recipes/{recipe_id}/')
async def edit_recipe(recipe_id: int, new_recipe: RecipePydanticIn,
                      current_user: HouseholdMember = Depends(get_current_active_user)):
    recipe = await Recipe.get(id=recipe_id)
    recipe.meal_name, recipe.ingredients, recipe.notes = new_recipe.meal_name, new_recipe.ingredients, new_recipe.notes
    await recipe.save()
    return await get_recipes()


@router.delete('/recipes/{recipe_id}/')
async def delete_recipe(recipe_id: int, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await Recipe.filter(id=recipe_id).delete()
    return await get_recipes()
