const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');
const os = require('os');
const osUtils = require('os-utils');
const fs = require('fs');

// Создаем логгер
const serverLogs = [];
const MAX_LOGS = 5000; // Увеличиваем максимальное количество сохраняемых логов

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type,
        message: typeof message === 'object' ? JSON.stringify(message) : message
    };
    
    console.log(`[${timestamp}] [${type}] ${logEntry.message}`);
    
    // Добавляем в начало массива и обрезаем если нужно
    serverLogs.unshift(logEntry);
    if (serverLogs.length > MAX_LOGS) {
        serverLogs.length = MAX_LOGS;
    }
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// Настраиваем маршрут для логов с пагинацией
// Маршрут для API endpoint, получающий логи от фронтенда
app.post('/api/frontend-logs', express.json(), (req, res) => {
    try {
        const frontendLogs = req.body.logs;
        if (Array.isArray(frontendLogs)) {
            frontendLogs.forEach(logEntry => {
                if (logEntry && logEntry.message) {
                    log(`[FRONTEND] ${logEntry.message}`, logEntry.type || 'info');
                }
            });
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, error: 'Invalid log format' });
        }
    } catch (error) {
        console.error('Error processing frontend logs:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/log', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const logsPerPage = parseInt(req.query.limit) || 100;
    const filterType = req.query.type || 'all';
    const startIndex = (page - 1) * logsPerPage;
    
    // Применяем фильтрацию по типу, если запрошено
    let filteredLogs = serverLogs;
    if (filterType !== 'all') {
        filteredLogs = serverLogs.filter(log => log.type === filterType);
    }
    
    const endIndex = startIndex + logsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Server Logs</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #121212;
                color: #f8f9fa;
                margin: 0;
                padding: 20px;
            }
            h1 {
                color: #8a2be2;
            }
            .log-entry {
                background-color: #1e1e1e;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 10px;
                border-left: 4px solid;
            }
            .log-entry.info {
                border-left-color: #17a2b8;
            }
            .log-entry.error {
                border-left-color: #dc3545;
            }
            .log-entry.warning {
                border-left-color: #ffc107;
            }
            .log-entry.resources {
                border-left-color: #28a745;
            }
            .timestamp {
                color: #adb5bd;
                font-size: 0.85em;
            }
            .type {
                font-weight: bold;
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                margin-right: 8px;
                font-size: 0.85em;
            }
            .type.info {
                background-color: #17a2b8;
                color: white;
            }
            .type.error {
                background-color: #dc3545;
                color: white;
            }
            .type.warning {
                background-color: #ffc107;
                color: black;
            }
            .type.resources {
                background-color: #28a745;
                color: white;
            }
            .pagination {
                margin-top: 20px;
                display: flex;
                justify-content: center;
            }
            .pagination a {
                display: inline-block;
                padding: 8px 16px;
                margin: 0 4px;
                text-decoration: none;
                background-color: #333;
                color: white;
                border-radius: 4px;
            }
            .pagination a.active {
                background-color: #8a2be2;
            }
            .pagination a:hover:not(.active) {
                background-color: #444;
            }
            .refresh-btn {
                background-color: #8a2be2;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 20px;
            }
            .refresh-btn:hover {
                background-color: #7726c3;
            }
            .log-message {
                margin-top: 5px;
                word-break: break-all;
            }
            .log-container {
                max-width: 1200px;
                margin: 0 auto;
            }
        </style>
    </head>
    <body>
        <div class="log-container">
            <h1>Server Logs</h1>
            <div class="page-info">
                Сторінка ${page} з ${totalPages || 1} (всього записів: ${filteredLogs.length})
            </div>
            <div class="filter-controls" style="margin-bottom: 20px; padding-top: 20px;">
                <a href="?type=all&page=1" class="refresh-btn" style="text-decoration: none; margin-right: 5px; ${filterType === 'all' ? 'background-color: #7726c3;' : ''}">Всі</a>
                <a href="?type=info&page=1" class="refresh-btn" style="text-decoration: none; margin-right: 5px; ${filterType === 'info' ? 'background-color: #7726c3;' : ''}">Інфо</a>
                <a href="?type=error&page=1" class="refresh-btn" style="text-decoration: none; margin-right: 5px; ${filterType === 'error' ? 'background-color: #7726c3;' : ''}">Помилки</a>
                <a href="?type=warning&page=1" class="refresh-btn" style="text-decoration: none; margin-right: 5px; ${filterType === 'warning' ? 'background-color: #7726c3;' : ''}">Попередження</a>
                <a href="?type=resources&page=1" class="refresh-btn" style="text-decoration: none; ${filterType === 'resources' ? 'background-color: #7726c3;' : ''}">Ресурси</a>
            </div>
            <button class="refresh-btn" onclick="window.location.reload()">Оновити логи</button>
            
            <div class="logs">
                ${paginatedLogs.map(entry => `
                    <div class="log-entry ${entry.type}">
                        <div>
                            <span class="timestamp">${entry.timestamp}</span>
                            <span class="type ${entry.type}">${entry.type.toUpperCase()}</span>
                        </div>
                        <div class="log-message">${entry.message}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="pagination">
                ${page > 1 ? `<a href="?type=${filterType}&page=${page-1}&limit=${logsPerPage}">Попередня</a>` : ''}
                ${Array.from({length: Math.min(totalPages, 10)}, (_, i) => {
                    const pageNum = page > 5 ? page - 5 + i : i + 1;
                    if (pageNum <= totalPages) {
                        return `<a class="${pageNum === page ? 'active' : ''}" href="?type=${filterType}&page=${pageNum}&limit=${logsPerPage}">${pageNum}</a>`;
                    }
                    return '';
                }).join('')}
                ${page < totalPages ? `<a href="?type=${filterType}&page=${page+1}&limit=${logsPerPage}">Наступна</a>` : ''}
            </div>
        </div>
    </body>
    </html>
    `);
});

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
        killed: false, // Статус "отключенный/убитый"
        role: 'player', // Роль по умолчанию - 'player' (может быть 'player' или 'host')
        orderIndex: 0 // Порядковый номер пользователя (будет назначен при входе в комнату)
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
                // Проверяем, не был ли это ведущий
                const wasHost = (client.role === 'host' && room.hostId === clientId);
                
                // Remove from room
                room.participants = room.participants.filter(id => id !== clientId);
                
                // Если это был ведущий, освобождаем роль ведущего в комнате
                if (wasHost) {
                    room.hostId = null;
                    console.log(`Host ${clientId} disconnected from room ${client.room}, host role is now available`);
                    
                    // Уведомляем всех в комнате, что ведущий отключился
                    broadcastToRoom(client.room, {
                        type: 'host_left',
                        message: 'Ведущий покинул комнату'
                    });
                }
                
                // Notify other participants
                broadcastToRoom(client.room, {
                    type: 'user',
                    kind: 'delete',
                    id: clientId,
                    wasHost: wasHost
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
            
        case 'camera_state':
            handleCameraState(clientId, message);
            break;
            
        case 'rename_peer':
            // Переименование другого пира (локально)
            handleRenamePeer(clientId, message);
            break;
            
        case 'killed':
            // Обновление статуса "отключен/убит"
            handleKilledStatus(clientId, message);
            break;
            
        case 'kill_peer':
            // Ведущий меняет статус "отключен/убит" для другого участника
            handleKillPeer(clientId, message);
            break;
            
        case 'revive_all':
            // Ведущий снимает статус "вбито" со всех участников
            handleReviveAll(clientId, message);
            break;
            
        case 'change_order_index':
            // Изменение порядкового номера игрока
            handleChangeOrderIndex(clientId, message);
            break;
            
        case 'balagan':
            // Обработка сообщения "Балаган" (запуск таймера) от ведущего
            handleBalagan(clientId, message);
            break;
            
        case 'slot_position':
            // Обработка сообщения о позиции участника в сетке
            handleSlotPosition(clientId, message);
            break;
            
        case 'hand_emoji':
            // Обработка клика по кнопке эмодзи ладони
            handleHandEmoji(clientId, message);
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
    // Если сообщение содержит targetId, то это переименование другого участника
    const targetId = message.targetId || clientId;
    
    // Если переименовывают другого участника, проверить, что инициатор - ведущий
    if (targetId !== clientId && client.role !== 'host') {
        // Отказ в переименовании для не-ведущего
        sendToClient(client.ws, {
            type: 'error',
            message: 'Только ведущий может переименовывать других участников'
        });
        return;
    }
    
    // Получить клиента, которого переименовывают
    const targetClient = clients.get(targetId);
    if (!targetClient) return;
    
    // Обновить имя пользователя
    targetClient.username = newUsername;
    console.log(`Client ${targetId} renamed to ${newUsername} by ${clientId}`);
    
    // Сообщить всем в комнате о смене имени
    broadcastToRoom(client.room, {
        type: 'user_renamed',
        id: targetId,
        username: newUsername
    });
    
    // Подтвердить смену имени
    if (targetId === clientId) {
        // Если пользователь меняет своё имя
        sendToClient(client.ws, {
            type: 'rename_confirmed',
            id: targetId,
            username: newUsername
        });
    } else {
        // Если ведущий меняет имя другого участника, отправляем подтверждение и этому участнику
        sendToClient(targetClient.ws, {
            type: 'rename_confirmed',
            id: targetId,
            username: newUsername
        });
    }
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

// Обработка изменения статуса "вбито"
function handleKilledStatus(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    // Обновить статус пользователя
    client.killed = !!message.killed;
    console.log(`Client ${clientId} ${client.killed ? 'killed (ВБИТО)' : 'revived'}`);
    
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

// Ведущий изменяет статус "вбито" для другого участника
function handleKillPeer(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    // Проверяем, что инициатор - ведущий
    if (client.role !== 'host') {
        sendToClient(client.ws, {
            type: 'error',
            message: 'Только ведущий может управлять статусом других участников'
        });
        return;
    }
    
    // Получаем целевого клиента
    const targetId = message.targetId;
    const targetClient = clients.get(targetId);
    
    if (!targetClient || targetClient.room !== client.room) {
        sendToClient(client.ws, {
            type: 'error',
            message: 'Указанный участник не найден или не в той же комнате'
        });
        return;
    }
    
    // Обновляем статус целевого клиента
    targetClient.killed = !!message.killed;
    console.log(`Host ${clientId} set client ${targetId} killed status to ${targetClient.killed ? 'killed (ВБИТО)' : 'alive'}`);
    
    // Сообщаем всем в комнате об изменении статуса
    broadcastToRoom(client.room, {
        type: 'user_killed',
        id: targetId,
        killed: targetClient.killed
    });
    
    // Подтверждаем изменение статуса целевому клиенту
    sendToClient(targetClient.ws, {
        type: 'killed_confirmed',
        id: targetId,
        killed: targetClient.killed
    });
    
    // Подтверждаем ведущему успешное изменение
    sendToClient(client.ws, {
        type: 'kill_peer_confirmed', 
        targetId: targetId,
        killed: targetClient.killed
    });
}

// Ведущий снимает статус "вбито" со всех участников
function handleReviveAll(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    // Проверяем, что инициатор - ведущий
    if (client.role !== 'host') {
        sendToClient(client.ws, {
            type: 'error',
            message: 'Только ведущий может снять статус "вбито" со всех участников'
        });
        return;
    }
    
    const room = rooms.get(client.room);
    if (!room) return;
    
    console.log(`Host ${clientId} is reviving all participants in room ${client.room}`);
    
    // Список ID клиентов, у которых изменился статус
    const changedClients = [];
    
    // Снимаем статус "вбито" со всех участников в комнате
    room.participants.forEach(participantId => {
        const participant = clients.get(participantId);
        if (participant && participant.killed) {
            participant.killed = false;
            changedClients.push(participantId);
            
            // Уведомляем каждого участника об изменении его статуса
            sendToClient(participant.ws, {
                type: 'killed_confirmed',
                id: participantId,
                killed: false
            });
        }
    });
    
    if (changedClients.length > 0) {
        // Уведомляем всех участников об изменениях
        changedClients.forEach(id => {
            broadcastToRoom(client.room, {
                type: 'user_killed',
                id: id,
                killed: false
            });
        });
        
        // Подтверждаем ведущему успешное выполнение команды
        sendToClient(client.ws, {
            type: 'revive_all_confirmed',
            count: changedClients.length
        });
        
        console.log(`Host ${clientId} revived ${changedClients.length} participants`);
    } else {
        // Если никто не был "убит", сообщаем ведущему
        sendToClient(client.ws, {
            type: 'revive_all_confirmed',
            count: 0,
            message: 'Нет участников со статусом "вбито"'
        });
        
        console.log(`Host ${clientId} attempted to revive all, but no participants were killed`);
    }
}

// Handle joining a room
function handleJoin(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    const roomName = message.group || 'default';
    const username = message.username || 'Anonymous';
    const requestedRole = message.role || 'player'; // Запрошенная роль (player или host)
    
    // Store client info
    client.username = username;
    client.room = roomName;
    
    // Create room if doesn't exist
    if (!rooms.has(roomName)) {
        rooms.set(roomName, {
            name: roomName,
            participants: [],
            hostId: null // ID ведущего (если есть)
        });
    }
    
    const room = rooms.get(roomName);
    
    // Определяем роль клиента
    if (requestedRole === 'host') {
        // Проверяем, есть ли уже ведущий в комнате
        if (room.hostId && room.participants.includes(room.hostId) && 
            room.hostId !== clientId) {
            // Уже есть ведущий, отклоняем запрос
            sendToClient(client.ws, {
                type: 'error',
                message: 'В комнате уже есть ведущий. Вы будете подключены как игрок.'
            });
            client.role = 'player';
        } else {
            // Назначаем этого клиента ведущим
            client.role = 'host';
            room.hostId = clientId;
            console.log(`Client ${clientId} assigned as host in room ${roomName}`);
        }
    } else {
        client.role = 'player';
    }
    
    // Add to room - проверяем, не было ли уже этого участника в комнате
    if (!room.participants.includes(clientId)) {
        room.participants.push(clientId);
        
        // Назначаем порядковый номер только игрокам (не ведущим)
        if (client.role === 'player') {
            // Берем максимальный существующий номер + 1 среди игроков
            let maxOrderIndex = 0;
            room.participants.forEach(id => {
                const participant = clients.get(id);
                if (participant && participant.role === 'player' && participant.orderIndex > maxOrderIndex) {
                    maxOrderIndex = participant.orderIndex;
                }
            });
            client.orderIndex = maxOrderIndex + 1;
            console.log(`Assigned order index ${client.orderIndex} to player ${clientId}`);
        } else {
            // Ведущему не присваиваем порядковый номер
            client.orderIndex = null;
            console.log(`Host ${clientId} does not get an order index`);
        }
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
                killed: participant.killed,
                role: participant.role,
                orderIndex: participant.orderIndex || 0
            };
        })
        .filter(p => p !== null);
    
    // Notify client they've joined
    sendToClient(client.ws, {
        type: 'joined',
        id: clientId,
        room: roomName,
        users: otherParticipants,
        role: client.role,
        hostId: room.hostId,
        orderIndex: client.orderIndex // Передаем порядковый номер клиенту
    });
    
    // Notify others
    broadcastToRoom(roomName, {
        type: 'user',
        kind: 'add',
        id: clientId,
        username: username,
        killed: client.killed,
        role: client.role,
        isHost: client.role === 'host',
        orderIndex: client.orderIndex
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
        // Make a clean copy of the candidate to avoid potential corruption
        const candidateObject = {
            candidate: message.candidate.candidate,
            sdpMid: message.candidate.sdpMid,
            sdpMLineIndex: message.candidate.sdpMLineIndex,
            usernameFragment: message.candidate.usernameFragment
        };
        
        // Анализируем кандидата для подробного логирования
        let candidateType = 'unknown';
        let protocol = 'unknown';
        let address = 'unknown';
        let port = 'unknown';
        let priority = 'unknown';
        let foundation = 'unknown';
        let generation = 'unknown';
        let component = 'unknown';
        let networkType = 'unknown';
        
        if (message.candidate && message.candidate.candidate) {
            const candidateStr = message.candidate.candidate;
            
            // Определяем тип кандидата
            if (candidateStr.includes('typ host')) candidateType = 'host';
            else if (candidateStr.includes('typ srflx')) candidateType = 'srflx (Server Reflexive)';
            else if (candidateStr.includes('typ prflx')) candidateType = 'prflx (Peer Reflexive)';
            else if (candidateStr.includes('typ relay')) candidateType = 'relay (TURN)';
            
            // Определяем протокол
            if (candidateStr.includes(' udp ')) protocol = 'UDP';
            else if (candidateStr.includes(' tcp ')) protocol = 'TCP';
            
            // Попытка извлечь IP-адрес
            const ipMatch = candidateStr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
            if (ipMatch) address = ipMatch[0];
            
            // Извлекаем порт
            const portMatch = candidateStr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) (\d+)/);
            if (portMatch) port = portMatch[2];
            
            // Извлекаем приоритет
            const priorityMatch = candidateStr.match(/(\d+) typ/);
            if (priorityMatch) priority = priorityMatch[1];
            
            // Извлекаем foundation (первое число в строке кандидата)
            const foundationMatch = candidateStr.match(/^a=candidate:(\S+)/);
            if (foundationMatch) foundation = foundationMatch[1];
            
            // Тип сети (если есть)
            if (candidateStr.includes('network-type')) {
                const networkMatch = candidateStr.match(/network-type (\S+)/);
                if (networkMatch) {
                    let networkCode = networkMatch[1];
                    // Преобразуем коды сети в понятные имена
                    switch(networkCode) {
                        case 'wifi': networkType = 'WiFi'; break;
                        case 'cellular': networkType = 'Cellular'; break;
                        case 'ethernet': networkType = 'Ethernet'; break;
                        case 'vpn': networkType = 'VPN'; break;
                        default: networkType = networkCode;
                    }
                }
            }
            
            // Компонент (RTP или RTCP)
            const componentMatch = candidateStr.match(/ (\d+) /);
            if (componentMatch) {
                component = componentMatch[1] === '1' ? 'RTP' : 'RTCP';
            }
        }
        
        const senderUsername = clients.get(senderId)?.username || 'unknown';
        const recipientUsername = clients.get(recipientId)?.username || 'unknown';
        
        log(`ICE candidate: ${senderId}(${senderUsername}) → ${recipientId}(${recipientUsername}), ` +
           `type: ${candidateType}, network: ${networkType}, protocol: ${protocol}, ` +
           `address: ${address}:${port}, priority: ${priority}, component: ${component}`, 'webrtc');
        
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
        // Make sure we're only forwarding the required fields to avoid corruption
        const sdpObject = {
            type: message.sdp.type,
            sdp: message.sdp.sdp
        };
        
        // Подробное логирование информации о SDP
        const sdpType = message.sdp.type || 'unknown';
        
        // Извлекаем полезную информацию из SDP для лога
        let videoCodec = 'unknown';
        let audioEnabled = false;
        let maxBitrate = 'not specified';
        
        if (message.sdp && message.sdp.sdp) {
            const sdpStr = message.sdp.sdp;
            
            // Определяем видеокодек
            if (sdpStr.includes('VP8')) videoCodec = 'VP8';
            else if (sdpStr.includes('VP9')) videoCodec = 'VP9';
            else if (sdpStr.includes('H264')) videoCodec = 'H264';
            
            // Проверяем наличие аудио
            audioEnabled = sdpStr.includes('m=audio');
            
            // Ищем информацию о битрейте
            const bitrateMatch = sdpStr.match(/b=AS:(\d+)/);
            if (bitrateMatch) maxBitrate = bitrateMatch[1] + ' kbps';
        }
        
        log(`Forwarding ${sdpType} SDP from ${senderId} to ${recipientId} - codec: ${videoCodec}, audio: ${audioEnabled}, maxBitrate: ${maxBitrate}`, 'webrtc');
        
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

// Обработка изменения порядкового номера игрока
// Функция-заглушка для обратной совместимости (функционал удален)
function handleChangeOrderIndex(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;

    // Получаем комнату
    const roomName = client.room;
    const targetId = message.targetId || clientId;

    if (!message.orderIndex && message.orderIndex !== 0) {
        log(`Invalid order index in request from ${clientId}`, 'error');
        return;
    }

    if (client.role !== 'host' && targetId !== clientId) {
        // Игрок пытается изменить порядковый номер другого игрока
        log(`Client ${clientId} tried to change order index of ${targetId} but is not a host`, 'warn');
        return;
    }

    // Обновляем порядковый номер
    if (clients.get(targetId)) {
        clients.get(targetId).orderIndex = message.orderIndex;
        log(`Order index for client ${targetId} changed to ${message.orderIndex}`, 'info');
        
        // Отправляем подтверждение изменителю
        sendToClient(client.ws, {
            type: 'order_index_changed_confirmed',
            id: targetId,
            orderIndex: message.orderIndex
        });
        
        // Уведомляем всех о изменении порядкового номера
        broadcastToRoom(roomName, {
            type: 'order_index_changed',
            id: targetId,
            orderIndex: message.orderIndex
        }, clientId);
    } else {
        log(`Client ${targetId} not found for order index change`, 'warn');
    }
}

// Generate unique ID
// Хранение активных таймеров для каждой комнаты
const roomTimers = new Map();

// Обработка сообщения "Балаган" от ведущего
function handleBalagan(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    // Проверяем, что инициатор - ведущий
    if (client.role !== 'host') {
        sendToClient(client.ws, {
            type: 'error',
            message: 'Только ведущий может использовать функцию "Балаган"'
        });
        return;
    }
    
    const roomName = client.room;
    console.log(`Host ${clientId} initiated "Балаган" in room ${roomName}`);
    
    const duration = message.duration || 60; // Длительность в секундах (по умолчанию 60)
    const showAnimation = message.showAnimation !== undefined ? message.showAnimation : true;
    
    // Если в комнате уже есть активный таймер, отменяем его
    if (roomTimers.has(roomName)) {
        console.log(`Cancelling existing timer in room ${roomName}`);
        clearTimeout(roomTimers.get(roomName));
        roomTimers.delete(roomName);
    }
    
    // Отправляем сообщение всем в комнате о начале "Балагана" или таймера
    broadcastToRoom(roomName, {
        type: 'balagan',
        duration: duration,
        showAnimation: showAnimation
    });
    
    // Устанавливаем таймер для отправки сообщения о завершении таймера
    const timerId = setTimeout(() => {
        broadcastToRoom(roomName, {
            type: 'stop_balagan'
        });
        console.log(`Balagan timer ended in room ${roomName}`);
        
        // Удаляем таймер из списка активных
        if (roomTimers.has(roomName)) {
            roomTimers.delete(roomName);
        }
    }, duration * 1000);
    
    // Сохраняем ID таймера, чтобы можно было его отменить при необходимости
    roomTimers.set(roomName, timerId);
    
    // Подтверждаем ведущему успешное выполнение команды
    sendToClient(client.ws, {
        type: 'balagan_confirmed'
    });
}

// Обработка синхронизации позиций игроков
function handleSlotPosition(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    // Проверяем, что инициатор - ведущий или это сообщение о своей позиции
    if (client.role !== 'host' && message.peerId !== clientId) {
        sendToClient(client.ws, {
            type: 'error',
            message: 'Только ведущий может изменять позиции других участников'
        });
        return;
    }
    
    const peerId = message.peerId || clientId;
    const slotIndex = message.slotIndex;
    
    if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex > 11) {
        console.log(`Invalid slot index: ${slotIndex}`);
        return;
    }
    
    console.log(`Updating slot position for ${peerId} to ${slotIndex}`);
    
    // Транслируем обновление позиции всем участникам комнаты
    broadcastToRoom(client.room, {
        type: 'slot_position_update',
        peerId: peerId,
        slotIndex: slotIndex
    });
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Обработка клика по эмодзи ладони
// Обработка изменения состояния камеры
function handleCameraState(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    // Получаем информацию о клиенте для более подробного лога
    const username = client.username || 'unknown';
    const role = client.role || 'unknown';
    const roomName = client.room;
    
    log(`Camera state change: client ${clientId} (${username}, ${role}) in room ${roomName} - enabled: ${message.enabled}`, 'camera');
    
    // Если есть дополнительные параметры в сообщении, логируем их
    if (message.mediaConstraints) {
        const constraints = message.mediaConstraints;
        const resolutionInfo = constraints.width && constraints.height ? 
            `${constraints.width}x${constraints.height}` : 'unknown resolution';
        const frameRate = constraints.frameRate || 'auto';
        
        log(`Camera parameters for ${clientId}: resolution=${resolutionInfo}, frameRate=${frameRate}`, 'camera');
    }
    
    // Уведомляем всех участников в комнате об изменении состояния камеры
    broadcastToRoom(client.room, {
        type: 'camera_state',
        id: clientId,
        enabled: message.enabled
    });
}

function handleHandEmoji(clientId, message) {
    const client = clients.get(clientId);
    if (!client || !client.room) return;
    
    // Получаем информацию о клиенте для логирования
    const username = client.username || 'unknown';
    const role = client.role || 'unknown';
    const isKilled = client.isKilled || false;
    const roomName = client.room;
    
    // Проверяем, не является ли пользователь "убитым" (в этом случае нельзя поднимать руку)
    if (isKilled) {
        log(`Killed client ${clientId} (${username}) tried to use hand emoji - action blocked`, 'warn');
        sendToClient(client.ws, {
            type: 'error',
            message: 'Невозможно использовать эмодзи в режиме "Отключен"'
        });
        return;
    }
    
    log(`Hand emoji from client ${clientId} (${username}, ${role}) in room ${roomName}`, 'emoji');
    
    // Если указаны дополнительные параметры в сообщении, логируем их
    if (message.target) {
        log(`Hand emoji was directed at target: ${message.target}`, 'emoji');
    }
    
    // Отправляем сообщение всем в комнате о том, что пользователь нажал на эмодзи ладони
    broadcastToRoom(client.room, {
        type: 'hand_emoji',
        id: clientId,
        username: client.username
    });
    
    // Автоматически скрываем через 1 секунду
    setTimeout(() => {
        broadcastToRoom(client.room, {
            type: 'hand_emoji_end',
            id: clientId
        });
        log(`Hand emoji from ${username} ended automatically after 1 second`, 'emoji');
    }, 1000);
}

// Мониторинг ресурсов сервера
let currentCpuUsage = 0;
let currentMemoryUsage = 0;
let serverResources = {
    cpuUsage: 0,
    memoryUsage: 0,
    networkConnections: 0,
    recommendedBitrate: 300 // среднее значение по умолчанию (kbps)
};

// Обновлять метрики сервера каждые 5 секунд
setInterval(() => {
    // Получение загрузки CPU
    osUtils.cpuUsage((cpuUsage) => {
        serverResources.cpuUsage = cpuUsage;
        
        // Память
        serverResources.memoryUsage = 1 - osUtils.freememPercentage();
        
        // Количество подключений
        serverResources.networkConnections = clients.size;
        
        // Вычисляем рекомендуемый битрейт на основе метрик и количества участников
        calculateRecommendedBitrate();
        
        // Отправляем данные о ресурсах клиентам
        broadcastResourceInfo();
    });
}, 5000);

// Функция для определения рекомендуемого битрейта
function calculateRecommendedBitrate() {
    // Базовый битрейт при малом количестве подключений
    let baseBitrate = 600; // максимальное значение в kbps
    
    // Корректируем битрейт в зависимости от загрузки CPU и количества участников
    const connectionFactor = Math.min(1, serverResources.networkConnections / 10);
    const cpuFactor = serverResources.cpuUsage;
    const memoryFactor = serverResources.memoryUsage;
    
    // Уменьшаем битрейт при высокой нагрузке или большом количестве участников
    const reductionFactor = Math.max(0.25, 1 - (connectionFactor * 0.5 + cpuFactor * 0.3 + memoryFactor * 0.2));
    
    // Рассчитываем итоговый рекомендуемый битрейт
    serverResources.recommendedBitrate = Math.floor(baseBitrate * reductionFactor);
    
    // Ограничиваем минимальное значение
    if (serverResources.recommendedBitrate < 150) {
        serverResources.recommendedBitrate = 150;
    }
    
    const logMessage = `Server resources - CPU: ${(serverResources.cpuUsage * 100).toFixed(1)}%, Memory: ${(serverResources.memoryUsage * 100).toFixed(1)}%, Connections: ${serverResources.networkConnections}, Recommended bitrate: ${serverResources.recommendedBitrate} kbps`;
    console.log(logMessage);
    log(logMessage, 'resources');
}

// Отправка информации о ресурсах всем клиентам
function broadcastResourceInfo() {
    clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN && client.room) {
            sendToClient(client.ws, {
                type: 'server_resources',
                resources: {
                    cpuUsage: serverResources.cpuUsage,
                    memoryUsage: serverResources.memoryUsage,
                    connections: serverResources.networkConnections,
                    recommendedBitrate: serverResources.recommendedBitrate
                }
            });
        }
    });
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    log(`Server started at http://0.0.0.0:${PORT}/`, 'info');
    log(`Log viewer available at http://0.0.0.0:${PORT}/log`, 'info');
});
