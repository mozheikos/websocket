import asyncio
import json
import websockets

from websockets.legacy.server import WebSocketServerProtocol

from settings import PORT, OPEN_PROJECTS


async def _get_answer():
    return {
        'type': '',
        'projectId': '',
        'data': []
    }


async def init(websocket: WebSocketServerProtocol, event: str) -> None:
    answer = await _get_answer()
    answer['type'] = event
    answer['data'] = list(filter(lambda x: len(OPEN_PROJECTS[x]), OPEN_PROJECTS.keys()))

    await websocket.send(json.dumps(answer))


async def open_project(websocket: WebSocketServerProtocol, event: str, project: str) -> None:
    answer = await _get_answer()
    if project in OPEN_PROJECTS.keys():
        OPEN_PROJECTS[project].add(websocket)
    else:
        OPEN_PROJECTS[project] = {websocket}
    answer['type'] = event
    answer['projectId'] = project
    await websocket.send(json.dumps(answer))
    print(f'{websocket} connect to project {project}')


async def move(websocket: WebSocketServerProtocol, project: str, message: str) -> None:
    for ws in OPEN_PROJECTS[project]:
        if ws != websocket:
            try:
                await ws.send(message)
            except websockets.ConnectionClosedOK:
                OPEN_PROJECTS[project].remove(ws)
                print(f'{ws} disconnected')


async def close(websocket: WebSocketServerProtocol, project: str, message: str) -> None:
    await websocket.send(message)
    print(f'{websocket} disconnect from project {project}')
    OPEN_PROJECTS[project].remove(websocket)


async def handler(websocket: WebSocketServerProtocol):
    print(f"{websocket} just connected")
    async for message in websocket:
        message_dict = json.loads(message)
        event = message_dict.get('type')
        project = message_dict.get('projectId')
        if event == 'init':
            await init(websocket, event)

        elif event == "open":
            await open_project(websocket, event, project)

        elif event == "move":
            await move(websocket, project, message)

        elif event == 'close':
            await close(websocket, project, message)


async def main():
    print("server start")
    async with websockets.serve(handler, "", PORT):
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
