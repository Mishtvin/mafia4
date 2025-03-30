const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections
const clients = new Map();
const rooms = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    const clientId = generateId();
    
    // Store client connection
    clients.set(clientId, {
        id: clientId,
        ws: ws,
        username: null,
        room: null,
        killed: false // Статус "отключенный/убитый"
    });
    
    // Send initial connection confirmation
    sendToClient(ws, {
        type: 'connection',
        id: clientId,
        message: 'Connected to server'
    });
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            // Try to parse the message as JSON
            let data;
            try {
                data = JSON.parse(message);
            } catch (parseError) {
                console.error('Error parsing message:', parseError);
                sendToClient(ws, {
                    type: 'error',
                    message: 'Invalid message format: Unable to parse JSON'
                });
                return;
            }
            
            // Basic validation of message structure
            if (!data || typeof data !== 'object') {
                console.error('Invalid message format (not an object):', data);
                sendToClient(ws, {
                    type: 'error',
                    message: 'Invalid message format: Message must be an object'
                });
                return;
            }
            
            if (!data.type) {
                console.error('Invalid message (missing type):', data);
                sendToClient(ws, {
                    type: 'error',
                    message: 'Invalid message: Missing message type'
                });
                return;
            }
            
            console.log(`Received message of type ${data.type} from client ${clientId}`);
            
            // Process the message
            handleMessage(clientId, data);
        } catch (error) {
            console.error('Error handling message:', error);
            sendToClient(ws, {
                type: 'error',
                message: 'Server error processing your request'
            });
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        const client = clients.get(clientId);
        
        if (client && client.room) {
            // Notify others in the room
            const room = rooms.get(client.room);
            if (room) {
                // Remove from room
                room.participants = room.participants.filter(id => id !== clientId);
                
                // Notify other participants
                broadcastToRoom(client.room, {
                    type: 'user',
                    kind: 'delete',
                    id: clientId
                }, clientId);
                
                // If room is empty, delete it
                if (room.participants.length === 0) {
                    rooms.delete(client.room);
                    console.log(`Room ${client.room} deleted (empty)`);
                }
            }
        }
        
        // Remove from clients
        clients.delete(clientId);
    });
});

// Handle incoming messages
function handleMessage(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    switch (message.type) {
        case 'join':
            handleJoin(clientId, message);
            break;
            
        case 'ice':
            forwardIceCandidate(clientId, message);
            break;
            
        case 'sdp':
            forwardSDP(clientId, message);
            break;
            
        case 'rename':
            handleRename(clientId, message);
            break;
            
        case 'rename_peer':
            // Переименование другого пира (локально)
            handleRenamePeer(clientId, message);
            break;
            
        case 'killed':
            // Обновление статуса "отключен/убит"
            handleKilledStatus(clientId, message);
            break;
            
        default:
            sendToClient(client.ws, {
                type: 'error',
                message: 'Unknown message type'
            });
    }
}

// Обработка изменения собственного имени (видно всем)
function handleRename(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    const newUsername = message.username || 'Anonymous';
    
    // Обновить имя пользователя
    client.username = newUsername;
    console.log(`Client ${clientId} renamed to ${newUsername}`);
    
    // Сообщить всем в комнате о смене имени
    broadcastToRoom(client.room, {
        type: 'user_renamed',
        id: clientId,
        username: newUsername
    });
    
    // Подтвердить смену имени пользователю
    sendToClient(client.ws, {
        type: 'rename_confirmed',
        id: clientId,
        username: newUsername
    });
}

// Обработка переименования другого пира (локально для данного клиента)
function handleRenamePeer(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    // Просто подтвердить получение (изменение хранится только на клиенте)
    sendToClient(client.ws, {
        type: 'rename_peer_confirmed',
        id: message.peerId,
        username: message.username
    });
}

// Обработка изменения статуса "отключен/убит"
function handleKilledStatus(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    // Обновить статус пользователя
    client.killed = !!message.killed;
    console.log(`Client ${clientId} ${client.killed ? 'killed' : 'revived'}`);
    
    // Сообщить всем в комнате об изменении статуса
    broadcastToRoom(client.room, {
        type: 'user_killed',
        id: clientId,
        killed: client.killed
    });
    
    // Подтвердить изменение статуса пользователю
    sendToClient(client.ws, {
        type: 'killed_confirmed',
        id: clientId,
        killed: client.killed
    });
}

// Handle joining a room
function handleJoin(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    const roomName = message.group || 'default';
    const username = message.username || 'Anonymous';
    
    // Store client info
    client.username = username;
    client.room = roomName;
    
    // Create room if doesn't exist
    if (!rooms.has(roomName)) {
        rooms.set(roomName, {
            name: roomName,
            participants: []
        });
    }
    
    const room = rooms.get(roomName);
    
    // Add to room - проверяем, не было ли уже этого участника в комнате
    if (!room.participants.includes(clientId)) {
        room.participants.push(clientId);
    }
    
    // Собираем полный список участников, исключая текущего клиента
    const otherParticipants = room.participants
        .filter(id => id !== clientId)
        .map(id => {
            const participant = clients.get(id);
            if (!participant) return null;
            return {
                id: id,
                username: participant.username,
                killed: participant.killed
            };
        })
        .filter(p => p !== null);
    
    // Notify client they've joined
    sendToClient(client.ws, {
        type: 'joined',
        id: clientId,
        room: roomName,
        users: otherParticipants
    });
    
    // Notify others
    broadcastToRoom(roomName, {
        type: 'user',
        kind: 'add',
        id: clientId,
        username: username,
        killed: client.killed
    }, clientId);
    
    // Логирование активных соединений для отладки
    console.log(`Client ${clientId} (${username}) joined room: ${roomName}`);
    console.log(`Room ${roomName} now has ${room.participants.length} participants:`);
    room.participants.forEach(id => {
        const p = clients.get(id);
        if (p) {
            console.log(`- ${id} (${p.username})`);
        } else {
            console.log(`- ${id} (unknown/disconnected)`);
        }
    });
}

// Forward ICE candidate to recipient
function forwardIceCandidate(senderId, message) {
    const sender = clients.get(senderId);
    if (!sender || !sender.room) return;
    
    const recipientId = message.id;
    const recipient = clients.get(recipientId);
    
    if (recipient && recipient.room === sender.room) {
        console.log(`Forwarding ICE candidate from ${senderId} to ${recipientId}`);
        
        // Make a clean copy of the candidate to avoid potential corruption
        const candidateObject = {
            candidate: message.candidate.candidate,
            sdpMid: message.candidate.sdpMid,
            sdpMLineIndex: message.candidate.sdpMLineIndex,
            usernameFragment: message.candidate.usernameFragment
        };
        
        sendToClient(recipient.ws, {
            type: 'ice',
            id: senderId,
            candidate: candidateObject
        });
    } else {
        console.log(`Cannot forward ICE: recipient ${recipientId} not found or not in same room as sender`);
    }
}

// Forward SDP offer/answer to recipient
function forwardSDP(senderId, message) {
    const sender = clients.get(senderId);
    if (!sender || !sender.room) return;
    
    const recipientId = message.id;
    const recipient = clients.get(recipientId);
    
    if (recipient && recipient.room === sender.room) {
        console.log(`Forwarding ${message.sdp.type} from ${senderId} to ${recipientId}`);
        
        // Make sure we're only forwarding the required fields to avoid corruption
        const sdpObject = {
            type: message.sdp.type,
            sdp: message.sdp.sdp
        };
        
        sendToClient(recipient.ws, {
            type: 'sdp',
            id: senderId,
            sdp: sdpObject
        });
    } else {
        console.log(`Cannot forward SDP: recipient ${recipientId} not found or not in same room as sender`);
    }
}

// Send message to a specific client
function sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// Broadcast message to all clients in a room except the sender
function broadcastToRoom(roomName, message, exceptClientId = null) {
    const room = rooms.get(roomName);
    if (!room) return;
    
    room.participants.forEach(participantId => {
        if (participantId !== exceptClientId) {
            const participant = clients.get(participantId);
            if (participant) {
                sendToClient(participant.ws, message);
            }
        }
    });
}

// Generate unique ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
