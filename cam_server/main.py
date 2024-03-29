from base64 import b64decode

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from tortoise.contrib.fastapi import register_tortoise

from authentication import router, check_token, credentials_exception
from cam import Camera


camera = Camera()
app = FastAPI()
app.include_router(router)


def stream_video():
    while True:
        frame = camera.get_frame()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.get('/mstreamj.mjpg')
async def main(t: bytes):
    token = b64decode(t).decode('utf-8')
    print(token)
    if await check_token(token):
        return StreamingResponse(stream_video(), media_type='multipart/x-mixed-replace; boundary=frame')
    raise credentials_exception


# Register tortoise models
register_tortoise(
    app,
    db_url='sqlite://db.sqlite3',
    modules={'models': ['models']},
    generate_schemas=True,
    add_exception_handlers=True
)
