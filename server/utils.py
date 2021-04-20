from models import TaskPydantic, Task

async def parse_tasks():
    resp = {
        'Les': [],
        'Mike': []
    }
    for task in await TaskPydantic.from_queryset(Task.all()):
        if task.name == 'Les':
            resp['Les'].append((task.id, task.task))
        elif task.name == 'Mike':
            resp['Mike'].append((task.id, task.task))
    return resp
