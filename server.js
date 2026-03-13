const { WebSocketServer } = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port });

const clients = new Map();

wss.on('connection', (ws) => {
    ws.username = "Anonymous";
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'set_name':
                    ws.username = message.username;
                    clients.set(ws, ws.username);
                    broadcastUserList();
                    break;
                case 'broadcast':
                    broadcast({ type: 'message', from: ws.username, text: message.text });
                    break;
                case 'private':
                    sendPrivate(message.to, { type: 'private_message', from: ws.username, text: message.text });
                    break;
            }
        } catch (e) { console.error("Bad JSON"); }
    });

    ws.on('close', () => {
        clients.delete(ws);
        broadcastUserList();
    });
});

function broadcast(data) {
    const payload = JSON.stringify(data);
    wss.clients.forEach(client => { if (client.readyState === 1) client.send(payload); });
}

function sendPrivate(targetName, data) {
    const payload = JSON.stringify(data);
    for (let [client, name] of clients) {
        if (name === targetName && client.readyState === 1) client.send(payload);
    }
}

function broadcastUserList() {
    const users = Array.from(clients.values());
    broadcast({ type: 'user_list', users });
}

console.log(`Server started on port ${port}`);
