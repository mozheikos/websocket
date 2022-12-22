function openProject(projectId, ws) {
    ws.send(JSON.stringify(
        {
            'type': 'open',
            'projectId': projectId
        }
    ))
}

function closeProject(projectId, ws) {
    ws.send(JSON.stringify({
        'type': 'close',
        'projectId': projectId
    }))
}

function projectConnected(projectId, connect, disconnect) {
    const projectTitle = document.querySelector('.project');
    projectTitle.innerHTML = `Connected to project ${projectId}`;
    disconnect.className = 'show';
    connect.className = 'hide';
}

function projectDisconnected(connect, disconnect) {
    const projectTitle = document.querySelector('.project');
    projectTitle.innerHTML = 'Not connected';
    disconnect.className = 'hide';
    connect.className = 'show';
}

function receiveText(text) {
    const output = document.querySelector('.content');
    if (text){
        output.innerText = output.innerText + text;
    }
    else {
        output.innerText = output.innerText.slice(0, output.innerText.length - 1);
    }
}

function initialize(ws) {
    ws.send(JSON.stringify(
        {
            'type': 'init'
        }
    ))
}

window.addEventListener('load', () => {
        const ws = new WebSocket("ws://localhost:8002/");
        let opened_projects = 0;
        let projectId = 0;
        const connect = document.querySelector('#connect');
        const disconnect = document.querySelector('#disconnect');
        ws.addEventListener('message', (message) => {
            const data = JSON.parse(message.data);
            if (data.type === 'init'){
                if (!data.data.length) {
                    opened_projects = ["no opened projects",];
                } else {
                    opened_projects = data.data;
                }
                projectId = prompt(`Already opened:\n - ${opened_projects.join("\n - ")}`);
                if (projectId) {
                    openProject(projectId, ws);
                }
            } else if (data.type === 'open') {
                projectConnected(data.projectId, connect, disconnect);
            } else if (data.type === 'close') {
                projectDisconnected(connect, disconnect);
            } else if (data.type === 'move') {
                receiveText(data.data);
            }

        });
        connect.addEventListener('click', () => {
            initialize(ws);
        });
        disconnect.addEventListener('click', () => {
            closeProject(projectId, ws)
        });
        const input = document.querySelector('#text');
        input.addEventListener('input', (event) => {
            console.dir(event);
            const text = event.data;
            receiveText(text);
            const data = {
                'type': 'move',
                'projectId': projectId,
                'data': text
            }
            ws.send(JSON.stringify(data));
        })
    })