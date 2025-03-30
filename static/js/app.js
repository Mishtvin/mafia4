document.addEventListener('DOMContentLoaded', () => {
    // Initialize Feather icons
    feather.replace();
    
    // DOM elements
    const joinForm = document.getElementById('join-form');
    const cameraSelect = document.getElementById('camera-select');
    const loginSection = document.getElementById('login-section');
    const conferenceSection = document.getElementById('conference-section');
    const videoContainer = document.getElementById('video-container');
    const currentRoomSpan = document.getElementById('current-room');
    const leaveBtn = document.getElementById('leave-btn');
    const toggleVideoBtn = document.getElementById('toggle-video');
    const toggleKilledBtn = document.getElementById('toggle-killed');
    const renameBtn = document.getElementById('rename-btn');
    const confirmRenameBtn = document.getElementById('confirm-rename-btn');
    const newUsernameInput = document.getElementById('new-username');
    const renamePeerBtn = document.getElementById('rename-peer-btn');
    const peerSelect = document.getElementById('peer-select');
    const peerNewNameInput = document.getElementById('peer-new-name');
    const renamePeerSection = document.getElementById('rename-peer-section');
    const renameModal = new bootstrap.Modal(document.getElementById('rename-modal'));
    const errorModal = new bootstrap.Modal(document.getElementById('error-modal'));
    const errorMessage = document.getElementById('error-message');
    const videoContextMenu = document.getElementById('video-context-menu');
    
    // Элементы модального окна для настройки видео удаленных пиров
    const videoSettingsModal = new bootstrap.Modal(document.getElementById('video-settings-modal'));
    const videoSettingsPeerName = document.getElementById('video-settings-peer-name');
    const peerVideoQualitySelect = document.getElementById('peer-video-quality');
    const peerCustomVideoSettings = document.getElementById('peer-custom-video-settings');
    const peerVideoWidthInput = document.getElementById('peer-video-width');
    const peerVideoHeightInput = document.getElementById('peer-video-height');
    const peerVideoBitrateInput = document.getElementById('peer-video-bitrate');
    const peerVideoBitrateSlider = document.getElementById('peer-video-bitrate-slider');
    const peerBitrateValue = document.getElementById('peer-bitrate-value');
    const applyVideoSettingsBtn = document.getElementById('apply-video-settings-btn');
    
    // Элементы модального окна для настройки локального видео
    const localVideoSettingsModal = new bootstrap.Modal(document.getElementById('local-video-settings-modal'));
    const localVideoQualitySelect = document.getElementById('local-video-quality');
    const localCustomVideoSettings = document.getElementById('local-custom-video-settings');
    const localVideoWidthInput = document.getElementById('local-video-width');
    const localVideoHeightInput = document.getElementById('local-video-height');
    const localVideoBitrateInput = document.getElementById('local-video-bitrate');
    const localVideoBitrateSlider = document.getElementById('local-video-bitrate-slider');
    const localBitrateValue = document.getElementById('local-bitrate-value');
    const applyLocalVideoSettingsBtn = document.getElementById('apply-local-video-settings-btn');
    const localVideoSettingsBtn = document.getElementById('local-video-settings-btn');
    
    // Элементы сайдбара
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const controlSidebar = document.getElementById('control-sidebar');
    const sidebarVideoQualitySelect = document.getElementById('sidebar-video-quality');
    const sidebarCustomVideoSettings = document.getElementById('sidebar-custom-video-settings');
    const sidebarVideoWidthInput = document.getElementById('sidebar-video-width');
    const sidebarVideoHeightInput = document.getElementById('sidebar-video-height');
    const sidebarVideoBitrateInput = document.getElementById('sidebar-video-bitrate');
    const applySidebarVideoSettingsBtn = document.getElementById('apply-sidebar-video-settings-btn');
    const sidebarToggleVideoBtn = document.getElementById('sidebar-toggle-video');
    const sidebarToggleKilledBtn = document.getElementById('sidebar-toggle-killed');
    const sidebarRenameBtn = document.getElementById('sidebar-rename-btn');

    // WebRTC and Galène variables
    let socket = null;
    let localStream = null;
    let peerConnections = {};
    let localVideo = null;
    let username = '';
    let roomname = '';
    let serverId = null;
    let videoEnabled = true;
    let isKilled = false;  // Состояние "отключен/убит"
    
    // Список доступных камер и выбранная камера
    let availableCameras = [];
    let selectedCameraId = '';
    
    
    // Локальные переименования других пиров (видны только пользователю)
    const localPeerNames = new Map();
    // Информация о пирах
    const peers = new Map();
    
    // Настройки качества видео по умолчанию
    const videoQualityPresets = {
        low: { width: 320, height: 180, bitrate: 250 },
        medium: { width: 640, height: 480, bitrate: 1000 },
        high: { width: 1280, height: 720, bitrate: 2000 },
        hd: { width: 1920, height: 1080, bitrate: 3000 },
        uhd: { width: 3840, height: 2160, bitrate: 8000 }
    };
    
    // Текущие настройки видео для пиров (ID пира -> настройки)
    const peerVideoSettings = new Map();
    
    // ID текущего пира для изменения настроек видео
    let currentSettingsPeerId = null;
    
    // Инициализировать настройки локального видео при открытии модального окна
    if (localVideoSettingsBtn) {
        localVideoSettingsBtn.addEventListener('click', async () => {
            // Обновим список камер перед открытием модального окна
            await loadCameras();
            
            // Определить текущее качество видео
            const videoTrack = localStream && localStream.getVideoTracks()[0];
            if (videoTrack) {
                const settings = videoTrack.getSettings();
                
                // Определить, какой пресет выбрать
                let preset = 'medium';
                if (settings.width) {
                    if (settings.width <= 320) preset = 'low';
                    else if (settings.width <= 640) preset = 'medium';
                    else if (settings.width <= 1280) preset = 'high';
                    else preset = 'hd';
                }
                
                if (localVideoQualitySelect) {
                    // Установить значения в форме
                    localVideoQualitySelect.value = preset;
                }
                
                if (localCustomVideoSettings) {
                    localCustomVideoSettings.style.display = 'none';
                }
                
                if (localVideoWidthInput && localVideoHeightInput) {
                    // Установить видимые размеры
                    localVideoWidthInput.value = settings.width || videoQualityPresets[preset].width;
                    localVideoHeightInput.value = settings.height || videoQualityPresets[preset].height;
                }
                
                // Установить битрейт
                const bitrate = window.customBitrate || videoQualityPresets[preset].bitrate;
                
                if (localVideoBitrateInput) {
                    localVideoBitrateInput.value = bitrate;
                }
                
                if (localVideoBitrateSlider) {
                    localVideoBitrateSlider.value = bitrate;
                }
                
                if (localBitrateValue) {
                    localBitrateValue.textContent = `${bitrate} kbps`;
                }
                
                // Выбрать текущую камеру
                if (settings.deviceId && cameraSelect) {
                    cameraSelect.value = settings.deviceId;
                    selectedCameraId = settings.deviceId;
                }
            }
        });
    }

    // Удалены обработчики для настройки видео при входе, так как они перенесены в настройки после входа
    
    // Показать/скрыть пользовательские настройки видео для локального видео
    if (localVideoQualitySelect) {
        localVideoQualitySelect.addEventListener('change', () => {
            const selectedQuality = localVideoQualitySelect.value;
            if (localCustomVideoSettings) {
                localCustomVideoSettings.style.display = selectedQuality === 'custom' ? 'block' : 'none';
            }
            
            if (selectedQuality !== 'custom') {
                // Установить значения из пресета
                const preset = videoQualityPresets[selectedQuality];
                if (preset) {
                    if (localVideoWidthInput) localVideoWidthInput.value = preset.width;
                    if (localVideoHeightInput) localVideoHeightInput.value = preset.height;
                    if (localVideoBitrateInput) localVideoBitrateInput.value = preset.bitrate;
                    if (localVideoBitrateSlider) localVideoBitrateSlider.value = preset.bitrate;
                    if (localBitrateValue) localBitrateValue.textContent = `${preset.bitrate} kbps`;
                }
            }
        });
    }
    
    // Синхронизировать слайдер и поле ввода битрейта для локального видео
    if (localVideoBitrateSlider) {
        localVideoBitrateSlider.addEventListener('input', () => {
            const value = localVideoBitrateSlider.value;
            if (localVideoBitrateInput) localVideoBitrateInput.value = value;
            if (localBitrateValue) localBitrateValue.textContent = `${value} kbps`;
        });
    }
    
    if (localVideoBitrateInput) {
        localVideoBitrateInput.addEventListener('input', () => {
            const value = localVideoBitrateInput.value;
            if (value >= 100 && value <= 3000) {
                if (localVideoBitrateSlider) localVideoBitrateSlider.value = value;
                if (localBitrateValue) localBitrateValue.textContent = `${value} kbps`;
            }
        });
    }
    
    // Применить настройки локального видео
    if (applyLocalVideoSettingsBtn) {
        applyLocalVideoSettingsBtn.addEventListener('click', async () => {
            // Получить настройки из формы
            if (!localVideoQualitySelect) return;
            
            const selectedQuality = localVideoQualitySelect.value;
            let videoConstraints = {};
            let bitrate = 0;
            
            if (selectedQuality === 'custom') {
                if (!localVideoWidthInput || !localVideoHeightInput || !localVideoBitrateInput) return;
                
                const width = parseInt(localVideoWidthInput.value, 10);
                const height = parseInt(localVideoHeightInput.value, 10);
                bitrate = parseInt(localVideoBitrateInput.value, 10);
                
                videoConstraints = {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: 'user'
                };
            } else {
                const preset = videoQualityPresets[selectedQuality];
                videoConstraints = {
                    width: { ideal: preset.width },
                    height: { ideal: preset.height },
                    facingMode: 'user'
                };
                bitrate = preset.bitrate;
            }
            
            // Используем выбранную камеру из выпадающего списка в модальном окне
            if (cameraSelect && cameraSelect.value) {
                videoConstraints.deviceId = { exact: cameraSelect.value };
                selectedCameraId = cameraSelect.value;
            }
            
            // Сохраняем битрейт для будущего использования
            window.customBitrate = bitrate;
            
            try {
                // Остановить текущий стрим
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                }
                
                // Получить новый стрим с новыми настройками
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false
                });
                
                // Заменить локальный стрим
                localStream = newStream;
                
                if (localVideo) {
                    // Обновить видео элемент
                    const videoElement = localVideo.querySelector('video');
                    if (videoElement) {
                        videoElement.srcObject = newStream;
                    }
                }
                
                // Обновить видео треки во всех peer connections
                updateVideoTracksInPeerConnections(bitrate);
                
                // Закрыть модальное окно
                if (localVideoSettingsModal) {
                    localVideoSettingsModal.hide();
                }
                
            } catch (error) {
                console.error('Error applying local video settings:', error);
                showError(`Failed to apply video settings: ${error.message}`);
            }
        });
    }
    
    // Функция для обновления видео треков во всех peer connections
    function updateVideoTracksInPeerConnections(bitrate) {
        if (!localStream) return;
        
        const videoTrack = localStream.getVideoTracks()[0];
        if (!videoTrack) {
            console.warn('No video track found in local stream');
            return;
        }
        
        // Обновить видео треки во всех peer connections
        Object.values(peerConnections).forEach(pc => {
            const senders = pc.getSenders();
            const videoSender = senders.find(sender => 
                sender.track && sender.track.kind === 'video'
            );
            
            if (videoSender) {
                // Заменить трек
                videoSender.replaceTrack(videoTrack)
                    .then(() => {
                        console.log('Successfully replaced video track');
                        
                        // Установить битрейт
                        try {
                            const params = videoSender.getParameters();
                            if (!params.encodings) {
                                params.encodings = [{}];
                            }
                            
                            // Установить максимальный битрейт для видео
                            params.encodings[0].maxBitrate = bitrate * 1000; // Convert kbps to bps
                            
                            videoSender.setParameters(params)
                                .then(() => console.log(`Set bitrate for outgoing video: ${bitrate} kbps`))
                                .catch(e => console.error('Error setting video parameters:', e));
                        } catch (error) {
                            console.warn('Could not set video parameters:', error);
                        }
                    })
                    .catch(error => {
                        console.error('Error replacing video track:', error);
                    });
            }
        });
    }
    
    // Функция для обновления названия комнаты в сайдбаре
    function updateRoomInfo(roomName) {
        const currentRoomElement = document.getElementById('current-room');
        if (currentRoomElement) {
            currentRoomElement.textContent = roomName || 'default';
        }
    }
    
    // Показать/скрыть пользовательские настройки видео для пиров
    if (peerVideoQualitySelect) {
        peerVideoQualitySelect.addEventListener('change', () => {
            const selectedQuality = peerVideoQualitySelect.value;
            if (peerCustomVideoSettings) {
                peerCustomVideoSettings.style.display = selectedQuality === 'custom' ? 'block' : 'none';
            }
            
            if (selectedQuality !== 'custom') {
                // Установить значения из пресета
                const preset = videoQualityPresets[selectedQuality];
                if (preset) {
                    if (peerVideoWidthInput) peerVideoWidthInput.value = preset.width;
                    if (peerVideoHeightInput) peerVideoHeightInput.value = preset.height;
                    if (peerVideoBitrateInput) peerVideoBitrateInput.value = preset.bitrate;
                    if (peerVideoBitrateSlider) peerVideoBitrateSlider.value = preset.bitrate;
                    if (peerBitrateValue) peerBitrateValue.textContent = `${preset.bitrate} kbps`;
                }
            }
        });
    }
    
    // Синхронизировать слайдер и поле ввода битрейта для пиров
    if (peerVideoBitrateSlider) {
        peerVideoBitrateSlider.addEventListener('input', () => {
            const value = peerVideoBitrateSlider.value;
            if (peerVideoBitrateInput) peerVideoBitrateInput.value = value;
            if (peerBitrateValue) peerBitrateValue.textContent = `${value} kbps`;
        });
    }
    
    if (peerVideoBitrateInput) {
        peerVideoBitrateInput.addEventListener('input', () => {
            const value = peerVideoBitrateInput.value;
            if (value >= 100 && value <= 3000) {
                if (peerVideoBitrateSlider) peerVideoBitrateSlider.value = value;
                if (peerBitrateValue) peerBitrateValue.textContent = `${value} kbps`;
            }
        });
    }

    // Обработчик события выбора камеры в форме логина удален
    
    // Функция генерации случайного имени
    function generateRandomUsername() {
        const adjectives = ['Яркий', 'Быстрый', 'Смелый', 'Тихий', 'Громкий', 'Умный', 'Сильный', 'Веселый', 'Добрый', 'Милый'];
        const nouns = ['Лев', 'Волк', 'Орел', 'Тигр', 'Дельфин', 'Сокол', 'Медведь', 'Лиса', 'Пингвин', 'Енот'];
        
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNumber = Math.floor(Math.random() * 100);
        
        return `${randomAdj}${randomNoun}${randomNumber}`;
    }

    // Join form submission handler
    if (joinForm) {
        joinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Генерируем случайное имя пользователя
            username = generateRandomUsername();
            roomname = 'default'; // Всегда используем комнату default
            videoEnabled = true;  // Всегда включаем видео
            
            // Задаем настройки видео по умолчанию (средние)
            const preset = videoQualityPresets.medium;
            let videoConstraints = {
                width: { ideal: preset.width },
                height: { ideal: preset.height },
                facingMode: 'user'
            };
            
            // Сохраняем битрейт для будущего использования
            window.customBitrate = preset.bitrate;
            
            try {
                await setupLocalStream(videoConstraints);
                connectToGalene();
            } catch (error) {
                showError(`Failed to access camera: ${error.message}. Please make sure your camera is connected and you've granted permission to use it.`);
            }
        });
    }

    // Set up local video stream
    // Функция для получения списка доступных камер
    async function loadCameras() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.error('Your browser does not support camera enumeration');
            return;
        }
        
        try {
            // Сначала запросим временный доступ к устройствам через getUserMedia,
            // чтобы получить доступ к названиям устройств, иначе будет доступен только device.kind
            await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            availableCameras = videoDevices;
            
            console.log('Available cameras:', availableCameras);
            
            // Селектор камеры при логине удален
            
            if (cameraSelect) {
                // Сохраним текущее значение
                const currentValue = cameraSelect.value;
                
                // Очистим выпадающий список
                cameraSelect.innerHTML = '';
                
                if (videoDevices.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.text = 'No cameras found';
                    cameraSelect.appendChild(option);
                } else {
                    videoDevices.forEach(device => {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.text = device.label || `Camera ${videoDevices.indexOf(device) + 1}`;
                        cameraSelect.appendChild(option);
                    });
                    
                    // Если у нас был выбранный deviceId, попробуем его восстановить
                    if (currentValue && videoDevices.some(d => d.deviceId === currentValue)) {
                        cameraSelect.value = currentValue;
                    } else {
                        // Иначе выберем первую камеру или текущую выбранную в логине
                        cameraSelect.value = selectedCameraId || videoDevices[0].deviceId;
                    }
                }
            }
        } catch (error) {
            console.error('Error enumerating devices:', error);
        }
    }
    
    // Загрузим список камер при загрузке страницы
    loadCameras();
    
    async function setupLocalStream(videoConstraints = null) {
        try {
            console.log('Setting up local video stream, video enabled:', videoEnabled);
            
            // Check browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support camera access. Please try using Chrome or Firefox.');
            }
            
            // Обновим список камер, если нужно
            if (availableCameras.length === 0) {
                await loadCameras();
            }
            
            // Выбор камеры при входе удален
            
            // Try to get camera with different fallback options
            let stream = null;
            let deviceConstraints = videoConstraints || {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            };
            
            // Добавим выбор устройства, если оно указано
            if (selectedCameraId) {
                deviceConstraints.deviceId = { exact: selectedCameraId };
            }
            
            const constraints = {
                video: videoEnabled ? deviceConstraints : false,
                audio: false // No audio per requirements
            };
            
            try {
                console.log('Requesting media with constraints:', constraints);
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('Successfully obtained media stream with tracks:', 
                    stream.getTracks().map(t => `${t.kind}:${t.label}:${t.enabled}`));
            } catch (highQualityError) {
                console.warn('Failed with high quality settings, trying basic video:', highQualityError);
                
                // Fallback to basic video
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: videoEnabled,
                        audio: false
                    });
                    console.log('Successfully obtained basic stream');
                } catch (basicError) {
                    console.error('Failed to access camera with basic settings:', basicError);
                    throw new Error('Could not access your camera. Please check your camera permissions and try again.');
                }
            }
            
            if (!stream) {
                throw new Error('Failed to get media stream even though no error was thrown.');
            }
            
            localStream = stream;
            
            // Create local video element
            localVideo = document.createElement('div');
            localVideo.className = 'video-item';
            localVideo.innerHTML = `
                <video autoplay muted playsinline></video>
                <div class="video-label">You (${username})</div>
            `;
            
            const videoElement = localVideo.querySelector('video');
            
            // Log video events for debugging
            videoElement.addEventListener('loadedmetadata', () => {
                console.log('Local video metadata loaded', 
                    videoElement.videoWidth, 'x', videoElement.videoHeight);
            });
            
            videoElement.addEventListener('playing', () => {
                console.log('Local video started playing');
            });
            
            videoElement.addEventListener('error', (e) => {
                console.error('Local video error event:', e);
            });
            
            // Set the stream as source
            videoElement.srcObject = stream;
            
            // Add local video to the grid
            videoContainer.appendChild(localVideo);
            
            // Ensure video plays
            try {
                await videoElement.play();
                console.log('Local video playing successfully');
            } catch (playError) {
                console.warn('Warning playing local video:', playError);
                // We can continue even if playing fails as the autoplay attribute should handle it
            }
            
            return stream;
        } catch (error) {
            console.error('Error in setupLocalStream:', error);
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
                
                // Обновить название комнаты в сайдбаре
                updateRoomInfo(roomname);
                
                // Показать кнопку переключения сайдбара
                sidebarToggleBtn.style.display = 'block';
                
                // Показать имя пользователя в поле изменения имени
                newUsernameInput.value = username;
                
                // Очистить информацию и инициализировать список пиров
                peers.clear();
                localPeerNames.clear();
                
                // Закрыть существующие соединения
                Object.keys(peerConnections).forEach(peerId => {
                    if (peerConnections[peerId]) {
                        console.log(`Closing existing connection to ${peerId}`);
                        peerConnections[peerId].close();
                        delete peerConnections[peerId];
                    }
                });
                
                // Очистить видео-контейнер от удаленных видео
                const remoteVideos = videoContainer.querySelectorAll('[id^="remote-"]');
                remoteVideos.forEach(video => {
                    if (video !== localVideo) {
                        console.log(`Removing video element for ${video.id}`);
                        video.remove();
                    }
                });
                
                // Добавить пиров из комнаты и начать соединение
                console.log(`Received user list: ${message.users.length} users`);
                message.users.forEach(user => {
                    console.log(`Processing user from list: ${user.id} (${user.username})`);
                    
                    // Сохранить информацию о пире
                    if (user.id !== serverId) {
                        peers.set(user.id, {
                            id: user.id,
                            username: user.username,
                            killed: user.killed || false
                        });
                        
                        // Инициировать соединение
                        initiateConnection(user.id);
                    }
                });
                
                // Обновить выпадающий список для переименования
                updatePeerSelect();
                
                // Показать секцию для переименования других участников только если есть другие участники
                renamePeerSection.style.display = peers.size > 0 ? 'block' : 'none';
                break;
                
            case 'user':
                if (message.kind === 'add' && message.id !== serverId) {
                    // Добавляем нового пира в список
                    peers.set(message.id, {
                        id: message.id,
                        username: message.username,
                        killed: message.killed || false
                    });
                    
                    // Обновить выпадающий список для переименования
                    updatePeerSelect();
                    
                    // Показать секцию для переименования других участников
                    renamePeerSection.style.display = 'block';
                    
                    // New user joined, initiate connection only if our ID is "greater"
                    // This prevents both peers from initiating at the same time
                    if (serverId > message.id) {
                        console.log(`Initiating connection as higher ID peer (${serverId} > ${message.id})`);
                        initiateConnection(message.id);
                    } else {
                        console.log(`Waiting for connection from peer with higher ID (${message.id} > ${serverId})`);
                    }
                } else if (message.kind === 'delete' && peerConnections[message.id]) {
                    // Удаляем пира из списка
                    peers.delete(message.id);
                    
                    // Удаляем локальную информацию об имени пира
                    localPeerNames.delete(message.id);
                    
                    // Обновить выпадающий список для переименования
                    updatePeerSelect();
                    
                    // Скрыть секцию для переименования если нет других участников
                    renamePeerSection.style.display = peers.size > 0 ? 'block' : 'none';
                    
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
                
            case 'user_renamed':
                // Обработка сообщения о переименовании пира
                if (message.id !== serverId) {
                    // Обновить имя в списке пиров
                    const peer = peers.get(message.id);
                    if (peer) {
                        peer.username = message.username;
                        
                        // Обновить имя в видео элементе
                        updatePeerLabel(message.id);
                        
                        // Обновить выпадающий список для переименования
                        updatePeerSelect();
                    }
                }
                break;
                
            case 'rename_confirmed':
                // Подтверждение изменения собственного имени
                if (message.id === serverId) {
                    username = message.username;
                    // Обновить имя в видео элементе
                    updateLocalLabel();
                }
                break;
                
            case 'rename_peer_confirmed':
                // Подтверждение изменения имени другого пира (только для нас)
                const peerId = message.id;
                localPeerNames.set(peerId, message.username);
                // Обновить имя в видео элементе
                updatePeerLabel(peerId);
                break;
                
            case 'user_killed':
                // Обработка изменения статуса "отключен/убит"
                if (message.id !== serverId) {
                    // Обновить статус в списке пиров
                    const peer = peers.get(message.id);
                    if (peer) {
                        peer.killed = message.killed;
                        
                        // Обновить отображение в видео элементе
                        updatePeerKilledStatus(message.id);
                    }
                }
                break;
                
            case 'killed_confirmed':
                // Подтверждение изменения собственного статуса
                if (message.id === serverId) {
                    isKilled = message.killed;
                    // Обновить отображение в видео элементе
                    updateLocalKilledStatus();
                }
                break;
        }
    }
    
    // Обновить отображение локального статуса "убит"
    function updateLocalKilledStatus() {
        if (localVideo) {
            if (isKilled) {
                localVideo.classList.add('killed');
            } else {
                localVideo.classList.remove('killed');
            }
        }
    }
    
    // Обновить отображение статуса "убит" для удаленного пира
    function updatePeerKilledStatus(peerId) {
        const videoElement = document.getElementById(`remote-${peerId}`);
        const peer = peers.get(peerId);
        
        if (videoElement && peer) {
            if (peer.killed) {
                videoElement.classList.add('killed');
            } else {
                videoElement.classList.remove('killed');
            }
        }
    }
    
    // Обновить отображение имени для локального видео
    function updateLocalLabel() {
        if (localVideo) {
            const label = localVideo.querySelector('.video-label');
            if (label) {
                label.textContent = `You (${username})`;
            }
        }
    }
    
    // Обновить отображение имени для удаленного пира
    function updatePeerLabel(peerId) {
        const videoElement = document.getElementById(`remote-${peerId}`);
        if (!videoElement) return;
        
        const label = videoElement.querySelector('.video-label');
        if (!label) return;
        
        // Если есть локальное имя, используем его, иначе используем имя из списка пиров
        const localName = localPeerNames.get(peerId);
        const peer = peers.get(peerId);
        
        if (localName) {
            label.textContent = localName;
        } else if (peer) {
            label.textContent = peer.username;
        } else {
            label.textContent = 'Participant';
        }
    }
    
    // Обновить выпадающий список для переименования
    function updatePeerSelect() {
        // Очистить список
        peerSelect.innerHTML = '<option value="">-- Select Participant --</option>';
        
        // Добавить всех пиров в выпадающий список
        peers.forEach(peer => {
            const option = document.createElement('option');
            option.value = peer.id;
            
            // Если есть локальное имя, показать его в скобках
            const localName = localPeerNames.get(peer.id);
            if (localName) {
                option.textContent = `${peer.username} (renamed to: ${localName})`;
            } else {
                option.textContent = peer.username;
            }
            
            peerSelect.appendChild(option);
        });
    }

    // Initiate WebRTC connection with a peer
    function initiateConnection(peerId) {
        console.log(`Initiating connection to peer: ${peerId}`);
        
        try {
            // Configure RTCPeerConnection with STUN servers
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ],
                iceCandidatePoolSize: 10
            });
            
            peerConnections[peerId] = pc;
            
            // Add local tracks to the connection
            if (localStream) {
                console.log(`Adding ${localStream.getTracks().length} local tracks to connection`);
                localStream.getTracks().forEach(track => {
                    const sender = pc.addTrack(track, localStream);
                    
                    // Если это видеотрек, применить настройки битрейта если они заданы
                    if (track.kind === 'video' && window.customBitrate) {
                        // Установить параметры для видео (битрейт)
                        try {
                            const params = sender.getParameters();
                            if (!params.encodings) {
                                params.encodings = [{}];
                            }
                            
                            // Установить максимальный битрейт для локального видео
                            params.encodings[0].maxBitrate = window.customBitrate * 1000; // Convert kbps to bps
                            
                            sender.setParameters(params)
                                .then(() => console.log(`Set initial bitrate for outgoing video: ${window.customBitrate} kbps`))
                                .catch(e => console.error('Error setting initial video parameters:', e));
                        } catch (error) {
                            console.warn('Could not set initial video parameters:', error);
                        }
                    }
                });
            } else {
                console.warn('No local stream available to add to peer connection');
            }
            
            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(`Generated ICE candidate for ${peerId}`);
                    sendMessage({
                        type: 'ice',
                        id: peerId,
                        candidate: event.candidate
                    });
                } else {
                    console.log(`Finished generating ICE candidates for ${peerId}`);
                }
            };
            
            // Handle ICE gathering state changes
            pc.onicegatheringstatechange = () => {
                console.log(`ICE gathering state with ${peerId}: ${pc.iceGatheringState}`);
            };
            
            // Handle ICE connection state changes
            pc.oniceconnectionstatechange = () => {
                console.log(`ICE connection state with ${peerId}: ${pc.iceConnectionState}`);
                if (pc.iceConnectionState === 'failed') {
                    console.log('Attempting to restart ICE for failed connection');
                    pc.restartIce();
                } else if (pc.iceConnectionState === 'disconnected') {
                    console.log('ICE disconnected - waiting to see if it reconnects');
                    // Wait to see if it reconnects on its own
                }
            };
            
            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    console.log(`Connection to ${peerId} failed or closed, removing peer`);
                    removePeer(peerId);
                } else if (pc.connectionState === 'connected') {
                    console.log(`Successfully connected to ${peerId}`);
                }
            };
            
            // Handle remote tracks
            pc.ontrack = (event) => {
                console.log(`Received ${event.streams.length} track(s) from ${peerId}`);
                if (event.streams && event.streams[0]) {
                    createRemoteVideoElement(peerId, event.streams[0]);
                } else {
                    console.warn('Received track without associated stream');
                }
            };
            
            // Create and send offer
            console.log(`Creating offer for ${peerId}`);
            pc.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: false,
                voiceActivityDetection: false,
                iceRestart: false
            })
            .then(offer => {
                console.log(`Setting local description for ${peerId}`);
                return pc.setLocalDescription(offer);
            })
            .then(() => {
                console.log(`Sending offer to ${peerId}`);
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
        } catch (error) {
            console.error('Exception in initiateConnection:', error);
            showError('Error setting up video connection');
        }
    }

    // Handle SDP offers and answers
    function handleSDP(message) {
        const peerId = message.id;
        
        try {
            // Check if message.sdp is valid and has the required properties
            if (!message.sdp || typeof message.sdp !== 'object') {
                console.error('Invalid SDP received:', message.sdp);
                return;
            }
            
            // Make a safe copy of the SDP object
            const sdpObj = {
                type: message.sdp.type,
                sdp: message.sdp.sdp
            };
            
            if (!sdpObj.type || !sdpObj.sdp) {
                console.error('SDP missing required fields:', sdpObj);
                return;
            }
            
            console.log(`Processing ${sdpObj.type} from ${peerId}`);

            // If this is an offer and we don't have a connection yet, create one
            if (sdpObj.type === 'offer' && !peerConnections[peerId]) {
                console.log(`Creating new peer connection for offer from ${peerId}`);
                
                // Create new connection
                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ],
                    iceCandidatePoolSize: 10
                });
                
                peerConnections[peerId] = pc;
                
                // Add local tracks
                if (localStream) {
                    localStream.getTracks().forEach(track => {
                        const sender = pc.addTrack(track, localStream);
                        
                        // Если это видеотрек, применить настройки битрейта если они заданы
                        if (track.kind === 'video' && window.customBitrate) {
                            // Установить параметры для видео (битрейт)
                            try {
                                const params = sender.getParameters();
                                if (!params.encodings) {
                                    params.encodings = [{}];
                                }
                                
                                // Установить максимальный битрейт для локального видео
                                params.encodings[0].maxBitrate = window.customBitrate * 1000; // Convert kbps to bps
                                
                                sender.setParameters(params)
                                    .then(() => console.log(`Set initial bitrate for outgoing video: ${window.customBitrate} kbps`))
                                    .catch(e => console.error('Error setting initial video parameters:', e));
                            } catch (error) {
                                console.warn('Could not set initial video parameters:', error);
                            }
                        }
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
                    } else if (pc.connectionState === 'connected') {
                        console.log(`Successfully connected to ${peerId}`);
                    }
                };
                
                // Handle ice connection state changes
                pc.oniceconnectionstatechange = () => {
                    console.log(`ICE connection state with ${peerId}: ${pc.iceConnectionState}`);
                    if (pc.iceConnectionState === 'failed') {
                        console.log('Restarting ICE...');
                        pc.restartIce();
                    }
                };
                
                // Handle remote tracks
                pc.ontrack = (event) => {
                    console.log(`Received remote track from ${peerId}`, event.streams);
                    if (event.streams && event.streams[0]) {
                        createRemoteVideoElement(peerId, event.streams[0]);
                    }
                };
            }
            
            // If we still don't have a connection for this peer, we can't process the SDP
            if (!peerConnections[peerId]) {
                console.error(`Received ${sdpObj.type} but no connection exists for peer ${peerId}`);
                return;
            }
            
            const pc = peerConnections[peerId];
            
            // Улучшенная обработка сигнальных состояний для надежного установления соединения
            const currentState = pc.signalingState;
            console.log(`Current signaling state with ${peerId}: ${currentState}`);
            
            // Создаем объект SDP описания
            const sdp = new RTCSessionDescription(sdpObj);
            
            // Обработка предложения (offer)
            if (sdp.type === 'offer') {
                // Если пришел offer, но мы уже отправили свой offer (одновременно)
                if (currentState === 'have-local-offer') {
                    // Разрешаем конфликт на основе ID (более низкий ID уступает более высокому)
                    if (serverId < peerId) {
                        console.log(`SDP conflict detected with ${peerId}. We have lower ID, rolling back our offer...`);
                        
                        // Откатываемся и принимаем входящий offer
                        pc.setLocalDescription({type: 'rollback'})
                        .then(() => {
                            console.log(`Rolled back local offer, setting remote offer from ${peerId}`);
                            return pc.setRemoteDescription(sdp);
                        })
                        .then(() => {
                            console.log(`Creating answer for ${peerId} after rollback`);
                            return pc.createAnswer();
                        })
                        .then(answer => {
                            console.log(`Setting local description (answer) for ${peerId}`);
                            return pc.setLocalDescription(answer);
                        })
                        .then(() => {
                            console.log(`Sending answer to ${peerId} after rollback`);
                            sendMessage({
                                type: 'sdp',
                                id: peerId,
                                sdp: pc.localDescription
                            });
                        })
                        .catch(error => {
                            console.error(`Error during rollback process with ${peerId}:`, error);
                        });
                    } else {
                        console.log(`SDP conflict detected with ${peerId}. We have higher ID, ignoring their offer.`);
                        // Просто игнорируем их offer, они должны откатиться и принять наш
                    }
                    return;
                } 
                // Нормальная обработка offer в стабильном состоянии
                else if (currentState === 'stable') {
                    console.log(`Setting remote offer from ${peerId} in stable state`);
                    
                    pc.setRemoteDescription(sdp)
                    .then(() => {
                        console.log(`Remote description set for ${peerId}, creating answer`);
                        return pc.createAnswer();
                    })
                    .then(answer => {
                        console.log(`Setting local description (answer) for ${peerId}`);
                        return pc.setLocalDescription(answer);
                    })
                    .then(() => {
                        console.log(`Sending answer to ${peerId}`);
                        sendMessage({
                            type: 'sdp',
                            id: peerId,
                            sdp: pc.localDescription
                        });
                    })
                    .catch(error => {
                        console.error(`Error processing offer from ${peerId}:`, error);
                        // Показываем ошибку только если соединение не установлено
                        if (pc.connectionState !== 'connected') {
                            showError(`Не удалось установить соединение с участником.`);
                        }
                    });
                } else {
                    console.warn(`Cannot process offer from ${peerId} in current state: ${currentState}`);
                }
            } 
            // Обработка ответа (answer)
            else if (sdp.type === 'answer') {
                // Можно установить answer только если у нас есть локальный offer
                if (currentState === 'have-local-offer') {
                    console.log(`Setting remote answer from ${peerId}`);
                    
                    pc.setRemoteDescription(sdp)
                    .then(() => {
                        console.log(`Successfully set remote answer from ${peerId}`);
                    })
                    .catch(error => {
                        console.error(`Error setting remote answer from ${peerId}:`, error);
                    });
                } else {
                    console.warn(`Cannot set remote answer from ${peerId} in state: ${currentState}`);
                }
            } else {
                console.warn(`Received unknown SDP type: ${sdp.type} from ${peerId}`);
            }
        } catch (error) {
            console.error('Exception in handleSDP:', error);
            showError('An error occurred while processing the connection.');
        }
    }

    // Create a remote video element for a peer
    function createRemoteVideoElement(peerId, stream) {
        console.log(`Creating video element for peer ${peerId} with stream:`, stream);
        
        try {
            // Remove existing element if it exists
            const existingElement = document.getElementById(`remote-${peerId}`);
            if (existingElement) {
                console.log(`Removing existing video element for peer ${peerId}`);
                existingElement.remove();
            }
            
            // Verify the stream has video tracks
            if (!stream || stream.getVideoTracks().length === 0) {
                console.warn(`Stream from peer ${peerId} has no video tracks`);
            }
            
            // Получить информацию о пире
            const peer = peers.get(peerId);
            // Проверить, есть ли локальное переименование
            const localName = localPeerNames.get(peerId);
            
            // Определить имя для отображения
            let displayName = 'Participant';
            if (localName) {
                displayName = localName;
            } else if (peer && peer.username) {
                displayName = peer.username;
            }
            
            // Create new video container
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.id = `remote-${peerId}`;
            videoItem.dataset.peerId = peerId;
            
            // Если пир имеет статус "убит", добавить соответствующий класс
            if (peer && peer.killed) {
                videoItem.classList.add('killed');
            }
            
            videoItem.innerHTML = `
                <video autoplay playsinline></video>
                <div class="video-label">${displayName}</div>
            `;
            
            const videoElement = videoItem.querySelector('video');
            
            // Make sure we handle the loadedmetadata event before playing
            videoElement.addEventListener('loadedmetadata', () => {
                console.log(`Video metadata loaded for peer ${peerId}`);
            });
            
            // Add error handling for video element
            videoElement.addEventListener('error', (e) => {
                console.error(`Video error for peer ${peerId}:`, e);
            });
            
            // Set srcObject for the video element
            videoElement.srcObject = stream;
            
            // Добавить обработчик контекстного меню
            videoItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                
                // Сохраняем ID пира для текущего контекстного меню
                currentSettingsPeerId = peerId;
                
                // Устанавливаем позицию контекстного меню
                videoContextMenu.style.left = `${e.pageX}px`;
                videoContextMenu.style.top = `${e.pageY}px`;
                
                // Показываем контекстное меню
                videoContextMenu.classList.add('show');
                
                document.addEventListener('click', hideContextMenu);
                
                return false;
            });
            
            // Add to video container
            videoContainer.appendChild(videoItem);
            
            // Play the video with proper error handling
            const playPromise = videoElement.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log(`Successfully playing video from peer ${peerId}`);
                    })
                    .catch(error => {
                        console.error(`Error playing video from peer ${peerId}:`, error);
                        // Try to play again after a delay
                        setTimeout(() => {
                            videoElement.play()
                                .then(() => console.log(`Retry successful for peer ${peerId}`))
                                .catch(e => console.error(`Retry failed for peer ${peerId}:`, e));
                        }, 1000);
                    });
            }
        } catch (error) {
            console.error(`Exception in createRemoteVideoElement for peer ${peerId}:`, error);
        }
    }
    
    // Скрыть контекстное меню
    function hideContextMenu() {
        videoContextMenu.classList.remove('show');
        document.removeEventListener('click', hideContextMenu);
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
    if (toggleVideoBtn) {
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
    }
    
    // Функции управления сайдбаром
    function showControlSidebar() {
        controlSidebar.classList.add('show');
        sidebarToggleBtn.style.display = 'none';
        
        // Инициализировать настройки сайдбара
        initSidebarSettings();
    }
    
    function hideControlSidebar() {
        controlSidebar.classList.remove('show');
        sidebarToggleBtn.style.display = 'block';
    }
    
    function initSidebarSettings() {
        // Определить текущее качество видео и заполнить форму
        const videoTrack = localStream && localStream.getVideoTracks()[0];
        if (videoTrack) {
            const settings = videoTrack.getSettings();
            
            // Определить, какой пресет выбрать
            let preset = 'medium';
            if (settings.width) {
                if (settings.width <= 320) preset = 'low';
                else if (settings.width <= 640) preset = 'medium';
                else if (settings.width <= 1280) preset = 'high';
                else if (settings.width <= 1920) preset = 'hd';
                else preset = 'uhd';
            }
            
            // Установить значения в форме
            if (sidebarVideoQualitySelect) sidebarVideoQualitySelect.value = preset;
            if (sidebarCustomVideoSettings) sidebarCustomVideoSettings.style.display = 'none';
            
            // Установить видимые размеры
            if (sidebarVideoWidthInput) sidebarVideoWidthInput.value = settings.width || videoQualityPresets[preset].width;
            if (sidebarVideoHeightInput) sidebarVideoHeightInput.value = settings.height || videoQualityPresets[preset].height;
            
            // Установить битрейт
            const bitrate = window.customBitrate || videoQualityPresets[preset].bitrate;
            if (sidebarVideoBitrateInput) sidebarVideoBitrateInput.value = bitrate;
            
            // Обновить иконки
            feather.replace();
        }
    }
    
    // Обработчики для сайдбара
    if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', showControlSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', hideControlSidebar);
    
    // Добавляем обработчик для кнопки Leave в сайдбаре
    const sidebarLeaveBtn = document.getElementById('sidebar-leave-btn');
    if (sidebarLeaveBtn) {
        sidebarLeaveBtn.addEventListener('click', disconnect);
    }
    
    // Показать/скрыть пользовательские настройки видео для сайдбара
    if (sidebarVideoQualitySelect) {
        sidebarVideoQualitySelect.addEventListener('change', () => {
            const selectedQuality = sidebarVideoQualitySelect.value;
            if (sidebarCustomVideoSettings) {
                sidebarCustomVideoSettings.style.display = selectedQuality === 'custom' ? 'block' : 'none';
            }
            
            if (selectedQuality !== 'custom') {
                const preset = videoQualityPresets[selectedQuality];
                if (preset) {
                    if (sidebarVideoWidthInput) sidebarVideoWidthInput.value = preset.width;
                    if (sidebarVideoHeightInput) sidebarVideoHeightInput.value = preset.height;
                    if (sidebarVideoBitrateInput) sidebarVideoBitrateInput.value = preset.bitrate;
                }
            }
        });
    }
    
    // Обработчик события выбора камеры в сайдбаре
    if (cameraSelect) {
        cameraSelect.addEventListener('change', () => {
            selectedCameraId = cameraSelect.value;
            console.log('Camera changed to:', selectedCameraId);
        });
    }
    
    // Применить настройки видео из сайдбара
    // Обработчик выбора камеры в сайдбаре
    if (cameraSelect) {
        cameraSelect.addEventListener('change', () => {
            selectedCameraId = cameraSelect.value;
            console.log('Camera changed to:', selectedCameraId);
        });
    }

    if (applySidebarVideoSettingsBtn && sidebarVideoQualitySelect) {
        applySidebarVideoSettingsBtn.addEventListener('click', async () => {
            const selectedQuality = sidebarVideoQualitySelect.value;
            let videoConstraints = {};
            let bitrate = 0;
            
            if (selectedQuality === 'custom') {
                const width = parseInt(sidebarVideoWidthInput.value, 10);
                const height = parseInt(sidebarVideoHeightInput.value, 10);
                bitrate = parseInt(sidebarVideoBitrateInput.value, 10);
                
                videoConstraints = {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: 'user'
                };
            } else {
                const preset = videoQualityPresets[selectedQuality];
                videoConstraints = {
                    width: { ideal: preset.width },
                    height: { ideal: preset.height },
                    facingMode: 'user'
                };
                bitrate = preset.bitrate;
            }
            
            // Добавим выбор устройства, если оно указано
            if (selectedCameraId) {
                videoConstraints.deviceId = { exact: selectedCameraId };
            }
            
            // Сохраняем битрейт для будущего использования
            window.customBitrate = bitrate;
            
            try {
                // Остановить текущий стрим
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                }
                
                // Получить новый стрим с новыми настройками
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false
                });
                
                // Заменить локальный стрим
                localStream = newStream;
                
                // Обновить видео элемент
                if (localVideo) {
                    const videoElement = localVideo.querySelector('video');
                    if (videoElement) {
                        videoElement.srcObject = newStream;
                    }
                }
                
                // Обновить видео треки во всех peer connections
                updateVideoTracksInPeerConnections(bitrate);
                
                // Закрыть сайдбар
                hideControlSidebar();
                
            } catch (error) {
                console.error('Error applying video settings from sidebar:', error);
                showError(`Failed to apply video settings: ${error.message}`);
            }
        });
    }

    // Leave button click handler
    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            disconnect();
        });
    }
    
    // Обработчик кнопки для включения/выключения статуса "убит"
    if (toggleKilledBtn) {
        toggleKilledBtn.addEventListener('click', () => {
            // Инвертировать текущий статус
            isKilled = !isKilled;
            
            // Отправить сообщение на сервер
            sendMessage({
                type: 'killed',
                killed: isKilled
            });
            
            // Обновить кнопки
            const killedIconHTML = isKilled ? 
                '<span data-feather="user"></span> Unmark as Disconnected' : 
                '<span data-feather="user-x"></span> Mark as Disconnected';
                
            if (toggleKilledBtn) toggleKilledBtn.innerHTML = killedIconHTML;
            if (sidebarToggleKilledBtn) sidebarToggleKilledBtn.innerHTML = killedIconHTML;
            
            feather.replace();
            
            // Обновить отображение в видео элементе (мгновенный отклик)
            updateLocalKilledStatus();
        });
    }
    
    // Обработчик кнопки для подтверждения переименования себя
    if (confirmRenameBtn && newUsernameInput) {
        confirmRenameBtn.addEventListener('click', () => {
            const newName = newUsernameInput.value.trim();
            if (!newName) {
                showError('Имя не может быть пустым');
                return;
            }
            
            // Отправить сообщение на сервер
            sendMessage({
                type: 'rename',
                username: newName
            });
            
            // Закрыть модальное окно
            if (renameModal) renameModal.hide();
        });
    }
    
    // Обработчик кнопки для переименования другого пира (локально)
    if (renamePeerBtn && peerSelect && peerNewNameInput) {
        renamePeerBtn.addEventListener('click', () => {
            const peerId = peerSelect.value;
            const newName = peerNewNameInput.value.trim();
            
            if (!peerId) {
                showError('Пожалуйста, выберите участника');
                return;
            }
            
            if (!newName) {
                showError('Имя не может быть пустым');
                return;
            }
            
            // Отправить сообщение на сервер (для подтверждения)
            sendMessage({
                type: 'rename_peer',
                peerId: peerId,
                username: newName
            });
            
            // Сохранить локально (немедленный отклик)
            localPeerNames.set(peerId, newName);
            
            // Обновить отображение
            updatePeerLabel(peerId);
            updatePeerSelect();
            
            // Очистить поля
            peerNewNameInput.value = '';
            peerSelect.value = '';
        });
    }
    
    // Обработчики для модального окна настроек видео
    const videoSettingsAction = document.querySelector('.video-settings-action');
    if (videoSettingsAction) {
        videoSettingsAction.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Получить peerId из контекстного меню
            const peerId = videoContextMenu.dataset.peerId;
            if (!peerId) return;
            
            // Скрыть контекстное меню
            videoContextMenu.style.display = 'none';
            
            // Сохранить текущий peerId для настроек
            currentSettingsPeerId = peerId;
            
            // Получить информацию о пире
            const peer = peers.get(peerId);
            const localName = localPeerNames.get(peerId);
            let displayName = 'Participant';
            
            if (localName) {
                displayName = localName;
            } else if (peer && peer.username) {
                displayName = peer.username;
            }
            
            // Установить имя в заголовке модального окна
            videoSettingsPeerName.textContent = displayName;
            
            // Получить текущие настройки видео пира или установить значения по умолчанию
            const settings = peerVideoSettings.get(peerId) || videoQualityPresets.medium;
            
            // Установить значения в модальном окне
            if (settings.preset && settings.preset !== 'custom') {
                peerVideoQualitySelect.value = settings.preset;
                peerCustomVideoSettings.style.display = 'none';
            } else {
                peerVideoQualitySelect.value = 'custom';
                peerCustomVideoSettings.style.display = 'block';
            }
            
            peerVideoWidthInput.value = settings.width || 640;
            peerVideoHeightInput.value = settings.height || 480;
            peerVideoBitrateInput.value = settings.bitrate || 1000;
            peerVideoBitrateSlider.value = settings.bitrate || 1000;
            peerBitrateValue.textContent = `${settings.bitrate || 1000} kbps`;
            
            // Открыть модальное окно
            videoSettingsModal.show();
        });
    }
    
    // Обработчик кнопки применения настроек видео
    if (applyVideoSettingsBtn) {
        applyVideoSettingsBtn.addEventListener('click', () => {
            if (!currentSettingsPeerId) return;
            
            // Получить настройки из формы
            const selectedQuality = peerVideoQualitySelect.value;
            let settings = {};
            
            if (selectedQuality === 'custom') {
                settings = {
                    preset: 'custom',
                    width: parseInt(peerVideoWidthInput.value, 10),
                    height: parseInt(peerVideoHeightInput.value, 10),
                    bitrate: parseInt(peerVideoBitrateInput.value, 10)
                };
            } else {
                const preset = videoQualityPresets[selectedQuality];
                settings = {
                    preset: selectedQuality,
                    width: preset.width,
                    height: preset.height,
                    bitrate: preset.bitrate
                };
            }
            
            // Сохранить настройки
            peerVideoSettings.set(currentSettingsPeerId, settings);
            
            // Применить настройки к пиру (отправить сообщение для изменения видео)
            const pc = peerConnections[currentSettingsPeerId];
            if (pc) {
                // Получить существующий senderParameters от отправителя видео
                const senders = pc.getSenders();
                const videoSender = senders.find(sender => 
                    sender.track && sender.track.kind === 'video'
                );
                
                if (videoSender) {
                    const params = videoSender.getParameters();
                    if (!params.encodings) {
                        params.encodings = [{}];
                    }
                    
                    // Установить максимальный битрейт
                    params.encodings[0].maxBitrate = settings.bitrate * 1000; // Convert kbps to bps
                    
                    // Применить параметры
                    videoSender.setParameters(params)
                        .then(() => {
                            console.log(`Successfully applied video settings for peer ${currentSettingsPeerId}:`, 
                                settings);
                        })
                        .catch(e => {
                            console.error(`Error applying video settings for peer ${currentSettingsPeerId}:`, e);
                        });
                }
            }
            
            // Закрыть модальное окно
            videoSettingsModal.hide();
        });
    }
    
    // Обработчик контекстного меню для видео элементов
    if (videoContainer) {
        videoContainer.addEventListener('contextmenu', (e) => {
            // Найти ближайший родительский элемент с классом video-item
            const videoItem = e.target.closest('.video-item');
            if (!videoItem) return;
            
            // Если это не локальное видео и имеет id
            if (videoItem !== localVideo && videoItem.id) {
                // Получить id пира из id элемента (remote-peerId)
                const peerId = videoItem.id.replace('remote-', '');
                
                // Отменить стандартное контекстное меню
                e.preventDefault();
                
                // Сохранить peerId в контекстном меню
                videoContextMenu.dataset.peerId = peerId;
                
                // Позиционировать и показать контекстное меню
                videoContextMenu.style.top = `${e.pageY}px`;
                videoContextMenu.style.left = `${e.pageX}px`;
                videoContextMenu.style.display = 'block';
            }
        });
    }
    
    // Обработчик клика на переименование в контекстном меню
    const renamePeerAction = document.querySelector('.rename-peer-action');
    if (renamePeerAction) {
        renamePeerAction.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Получить peerId из контекстного меню
            const peerId = videoContextMenu.dataset.peerId;
            if (!peerId) return;
            
            // Скрыть контекстное меню
            videoContextMenu.style.display = 'none';
            
            // Выбрать пира в выпадающем списке
            peerSelect.value = peerId;
            
            // Открыть модальное окно
            renameModal.show();
            
            // Фокус на поле ввода нового имени
            peerNewNameInput.focus();
        });
    }
    
    // Скрыть контекстное меню при клике вне его
    document.addEventListener('click', () => {
        if (videoContextMenu) {
            videoContextMenu.style.display = 'none';
        }
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
