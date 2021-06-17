import hashlib
import aioredis
import asyncio
import json


async def create_token(host, platform):
    return hashlib.sha256((str(host) + str(platform)).encode('utf-8')).hexdigest()


async def main():
    return await aioredis.create_redis_pool('redis://localhost')


loop = asyncio.get_running_loop()
task = loop.create_task(main())


def set_cache(cache_obj):
    global cache
    cache = cache_obj


task.add_done_callback(lambda t: set_cache(t.result()))


async def set_item(key, value):
    await cache.set(key, value)


async def set_weather(weather_dict: dict):
    await cache.execute('set', 'weather', json.dumps(weather_dict), 'ex', 3600)


async def get_weather():
    w = await get_item('weather')
    if w:
        return json.loads(w)


async def get_item(key):
    return await cache.get(key, encoding='utf-8')


async def get_keys():
    return await cache.keys('*', encoding='utf-8')


async def delete_key(key):
    await cache.delete(key)
