document.addEventListener('DOMContentLoaded', () => {
    // Initialize Feather icons
    feather.replace();

    // DOM elements
    const joinForm = document.getElementById('join-form');
    const usernameInput = document.getElementById('username');
    const roomnameInput = document.getElementById('roomname');
    const videoEnabledCheckbox = document.getElementById('video-enabled');
    const loginSection = document.getElementById('login-section');
    const conferenceSection = document.getElementById('conference-section');
    const videoContainer = document.getElementById('video-container');
    const currentRoomSpan = document.getElementById('current-room');
    const leaveBtn = document.getElementById('leave-btn');
    const toggleVideoBtn = document.getElementById('toggle-video');
    const errorModal = new bootstrap.Modal(document.getElementById('error-modal'));
    const errorMessage = document.getElementById('error-message');

    // WebRTC and Galène variables
    let socket = null;
    let localStream = null;
    let peerConnections = {};
    let localVideo = null;
    let username = '';
    let roomname = '';
    let serverId = null;
    let videoEnabled = true;

    // Join form submission handler
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        username = usernameInput.value.trim();
        roomname = roomnameInput.value.trim() || 'default';
        videoEnabled = videoEnabledCheckbox.checked;
        
        try {
            await setupLocalStream();
            connectToGalene();
        } catch (error) {
            showError(`Failed to access camera: ${error.message}. Please make sure your camera is connected and you've granted permission to use it.`);
        }
    });

    // Set up local video stream
    async function setupLocalStream() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: videoEnabled ? { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false,
                audio: false // No audio per requirements
            });
            
            // Create local video element
            localVideo = document.createElement('div');
            localVideo.className = 'video-item';
            localVideo.innerHTML = `
                <video autoplay muted playsinline></video>
                <div class="video-label">You (${username})</div>
            `;
            
            const videoElement = localVideo.querySelector('video');
            videoElement.srcObject = localStream;
            
            // Add local video to the grid
            videoContainer.appendChild(localVideo);
            
            return localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    // Connect to WebRTC server
    function connectToGalene() {
        // Determine WebSocket protocol (wss for https, ws for http)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        console.log(`Connecting to WebSocket: ${wsUrl}`);
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log('WebSocket connection established');
            // Join the room
            sendMessage({
                type: 'join',
                kind: 'join',
                group: roomname,
                username: username,
                password: ''
            });
        };
        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleGaleneMessage(message);
        };
        
        socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            disconnect();
            if (event.code !== 1000) {
                showError(`Connection to server closed: ${event.reason || 'Unknown reason'}`);
            }
        };
        
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            showError('Connection error. Please try again later.');
        };
    }

    // Handle messages from Galène server
    function handleGaleneMessage(message) {
        console.log('Received message:', message);
        
        switch (message.type) {
            case 'connection':
                // Successfully connected to server
                serverId = message.id;
                console.log(`Connected to server with ID: ${serverId}`);
                break;

            case 'error':
                showError(`Server error: ${message.message}`);
                break;
                
            case 'abort':
                showError(`Server error: ${message.error}`);
                break;
                
            case 'redirect':
                showError(`Redirected to ${message.location}`);
                break;
                
            case 'joined':
                // Successfully joined the room
                serverId = message.id;
                loginSection.style.display = 'none';
                conferenceSection.style.display = 'block';
                currentRoomSpan.textContent = roomname;
                
                // Start negotiation with existing peers
                message.users.forEach(user => {
                    if (user.id !== serverId) {
                        initiateConnection(user.id);
                    }
                });
                break;
                
            case 'user':
                if (message.kind === 'add' && message.id !== serverId) {
                    // New user joined, initiate connection
                    initiateConnection(message.id);
                } else if (message.kind === 'delete' && peerConnections[message.id]) {
                    // User left, clean up connection
                    removePeer(message.id);
                }
                break;
                
            case 'ice':
                // ICE candidate received
                if (peerConnections[message.id]) {
                    const candidate = new RTCIceCandidate(message.candidate);
                    peerConnections[message.id].addIceCandidate(candidate)
                        .catch(error => console.error('Error adding ICE candidate:', error));
                }
                break;
                
            case 'sdp':
                // SDP offer or answer received
                handleSDP(message);
                break;
        }
    }

    // Initiate WebRTC connection with a peer
    function initiateConnection(peerId) {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });
        
        peerConnections[peerId] = pc;
        
        // Add local tracks to the connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage({
                    type: 'ice',
                    id: peerId,
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                removePeer(peerId);
            }
        };
        
        // Handle remote tracks
        pc.ontrack = (event) => {
            createRemoteVideoElement(peerId, event.streams[0]);
        };
        
        // Create and send offer
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
                sendMessage({
                    type: 'sdp',
                    id: peerId,
                    sdp: pc.localDescription
                });
            })
            .catch(error => {
                console.error('Error creating offer:', error);
                showError('Failed to establish connection with a participant.');
            });
    }

    // Handle SDP offers and answers
    function handleSDP(message) {
        const peerId = message.id;
        
        if (!peerConnections[peerId]) {
            // Create new connection if it doesn't exist
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            });
            
            peerConnections[peerId] = pc;
            
            // Add local tracks
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    pc.addTrack(track, localStream);
                });
            }
            
            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendMessage({
                        type: 'ice',
                        id: peerId,
                        candidate: event.candidate
                    });
                }
            };
            
            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    removePeer(peerId);
                }
            };
            
            // Handle remote tracks
            pc.ontrack = (event) => {
                createRemoteVideoElement(peerId, event.streams[0]);
            };
        }
        
        const pc = peerConnections[peerId];
        const sdp = new RTCSessionDescription(message.sdp);
        
        pc.setRemoteDescription(sdp)
            .then(() => {
                if (sdp.type === 'offer') {
                    // Create and send answer if we received an offer
                    return pc.createAnswer()
                        .then(answer => pc.setLocalDescription(answer))
                        .then(() => {
                            sendMessage({
                                type: 'sdp',
                                id: peerId,
                                sdp: pc.localDescription
                            });
                        });
                }
            })
            .catch(error => {
                console.error('Error handling SDP:', error);
                showError('Failed to establish connection with a participant.');
            });
    }

    // Create a remote video element for a peer
    function createRemoteVideoElement(peerId, stream) {
        // Remove existing element if it exists
        const existingElement = document.getElementById(`remote-${peerId}`);
        if (existingElement) {
            existingElement.remove();
        }
        
        // Create new video container
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.id = `remote-${peerId}`;
        videoItem.innerHTML = `
            <video autoplay playsinline></video>
            <div class="video-label">Participant</div>
        `;
        
        const videoElement = videoItem.querySelector('video');
        videoElement.srcObject = stream;
        
        // Add to video container
        videoContainer.appendChild(videoItem);
        
        // Play the video (some browsers require this)
        videoElement.play().catch(error => console.error('Error playing video:', error));
    }

    // Remove a peer and clean up resources
    function removePeer(peerId) {
        const pc = peerConnections[peerId];
        if (pc) {
            pc.close();
            delete peerConnections[peerId];
            
            // Remove the video element
            const videoElement = document.getElementById(`remote-${peerId}`);
            if (videoElement) {
                videoElement.remove();
            }
        }
    }

    // Send a message to the Galène server
    function sendMessage(message) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not open, cannot send message:', message);
        }
    }

    // Disconnect from the room and clean up
    function disconnect() {
        // Close all peer connections
        Object.keys(peerConnections).forEach(peerId => {
            peerConnections[peerId].close();
        });
        peerConnections = {};
        
        // Close the websocket
        if (socket) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close(1000, 'User left the room');
            }
            socket = null;
        }
        
        // Stop the local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        // Clear the video container
        videoContainer.innerHTML = '';
        
        // Show the login section again
        loginSection.style.display = 'block';
        conferenceSection.style.display = 'none';
    }

    // Toggle local video
    toggleVideoBtn.addEventListener('click', async () => {
        videoEnabled = !videoEnabled;
        
        if (localStream) {
            // Stop existing video tracks
            localStream.getVideoTracks().forEach(track => track.stop());
            
            try {
                if (videoEnabled) {
                    // Re-enable video
                    const newStream = await navigator.mediaDevices.getUserMedia({
                        video: { 
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        },
                        audio: false
                    });
                    
                    // Replace the track in the peer connections
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    localStream.addTrack(newVideoTrack);
                    
                    // Update local video
                    const videoElement = localVideo.querySelector('video');
                    videoElement.srcObject = newStream;
                    
                    // Replace tracks in peer connections
                    Object.values(peerConnections).forEach(pc => {
                        const senders = pc.getSenders();
                        const videoSender = senders.find(sender => 
                            sender.track && sender.track.kind === 'video'
                        );
                        if (videoSender) {
                            videoSender.replaceTrack(newVideoTrack);
                        }
                    });
                    
                    // Update button icon
                    toggleVideoBtn.innerHTML = '<span data-feather="video-off"></span> Turn Off Video';
                    feather.replace();
                } else {
                    // Disable video - create empty track
                    const emptyStream = new MediaStream();
                    
                    // Update local video
                    const videoElement = localVideo.querySelector('video');
                    videoElement.srcObject = emptyStream;
                    
                    // Replace tracks in peer connections with null
                    Object.values(peerConnections).forEach(pc => {
                        const senders = pc.getSenders();
                        const videoSender = senders.find(sender => 
                            sender.track && sender.track.kind === 'video'
                        );
                        if (videoSender) {
                            videoSender.replaceTrack(null);
                        }
                    });
                    
                    // Update button icon
                    toggleVideoBtn.innerHTML = '<span data-feather="video"></span> Turn On Video';
                    feather.replace();
                }
            } catch (error) {
                console.error('Error toggling video:', error);
                showError('Failed to toggle video. Please check your camera permissions.');
            }
        }
    });

    // Leave button click handler
    leaveBtn.addEventListener('click', () => {
        disconnect();
    });

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorModal.show();
    }

    // Handle window unload to properly disconnect
    window.addEventListener('beforeunload', () => {
        disconnect();
    });
});
