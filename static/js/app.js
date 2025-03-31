document.addEventListener('DOMContentLoaded', () => {
    // Сразу скрываем сайдбар и кнопку сайдбара при загрузке страницы
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.style.display = 'none';
    }
    
    const controlSidebarElement = document.getElementById('control-sidebar');
    if (controlSidebarElement) {
        controlSidebarElement.style.display = 'none';
    }
    // Инициализация логов фронтенда
    window.appLogs = [];
    
    // Функции для управления камерой
    // Функция для отключения локальной камеры
    function disableLocalCamera() {
        if (!localStream) return;
        
        // Получаем видеодорожку
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            // Отключаем видеодорожку
            videoTrack.enabled = false;
            
            // Добавляем в лог информацию об отключении камеры
            console.log('Local camera disabled');
            
            // Добавить класс отключённой камеры к локальному видео контейнеру
            const localVideoContainer = document.getElementById('local-video-container');
            if (localVideoContainer) {
                localVideoContainer.classList.add('camera-disabled');
            }
            
            // Обновляем состояние кнопок в сайдбаре
            updateCameraButtonsState(false);
            
            // Получаем информацию о текущем видеопотоке для логирования на сервере
            let mediaInfo = {};
            if (videoTrack && videoTrack.getSettings) {
                const settings = videoTrack.getSettings();
                mediaInfo = {
                    width: settings.width,
                    height: settings.height,
                    frameRate: settings.frameRate,
                    deviceId: settings.deviceId
                };
                console.log("Camera disabled with settings:", settings);
            }
            
            // Отправляем сообщение всем участникам о том, что мы выключили камеру
            // с дополнительной информацией для логирования
            sendMessage({
                type: 'camera_state',
                enabled: false,
                mediaConstraints: mediaInfo
            });
        }
    }
    
    // Функция обновления состояния кнопок управления камерой в сайдбаре
    function updateCameraButtonsState(enabled) {
        const enableBtn = document.getElementById('sidebar-enable-camera-btn');
        const disableBtn = document.getElementById('sidebar-disable-camera-btn');
        
        if (enableBtn && disableBtn) {
            if (enabled) {
                enableBtn.classList.add('btn-success');
                enableBtn.classList.remove('btn-primary');
                enableBtn.disabled = true;
                
                disableBtn.classList.add('btn-danger');
                disableBtn.classList.remove('btn-secondary');
                disableBtn.disabled = false;
            } else {
                enableBtn.classList.add('btn-primary');
                enableBtn.classList.remove('btn-success');
                enableBtn.disabled = false;
                
                disableBtn.classList.add('btn-secondary');
                disableBtn.classList.remove('btn-danger');
                disableBtn.disabled = true;
            }
        }
    }
    
    // Функция для включения локальной камеры
    function enableLocalCamera() {
        if (!localStream) return;
        
        // Получаем видеодорожку
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            // Включаем видеодорожку
            videoTrack.enabled = true;
            
            // Добавляем в лог информацию о включении камеры
            console.log('Local camera enabled');
            
            // Удаляем класс отключённой камеры с локального видео контейнера
            const localVideoContainer = document.getElementById('local-video-container');
            if (localVideoContainer) {
                localVideoContainer.classList.remove('camera-disabled');
            }
            
            // Обновляем состояние кнопок в сайдбаре
            updateCameraButtonsState(true);
            
            // Получаем информацию о текущем видеопотоке для логирования на сервере
            let mediaInfo = {};
            if (videoTrack && videoTrack.getSettings) {
                const settings = videoTrack.getSettings();
                mediaInfo = {
                    width: settings.width,
                    height: settings.height,
                    frameRate: settings.frameRate,
                    deviceId: settings.deviceId
                };
                console.log("Camera enabled with settings:", settings);
            }
            
            // Отправляем сообщение всем участникам о том, что мы включили камеру
            // с дополнительной информацией для логирования
            sendMessage({
                type: 'camera_state',
                enabled: true,
                mediaConstraints: mediaInfo
            });
        }
    }
    
    function logToConsole(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
        
        // Добавляем в массив логов
        window.appLogs.unshift({
            timestamp,
            type,
            message: formattedMessage
        });
        
        // Ограничиваем количество логов
        if (window.appLogs.length > 1000) {
            window.appLogs.length = 1000;
        }
    }
    
    // Перехватываем console.log
    const originalConsoleLog = console.log;
    console.log = function() {
        // Вызываем оригинальный метод
        originalConsoleLog.apply(console, arguments);
        
        // Формируем сообщение для логирования
        const message = Array.from(arguments).map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        logToConsole(message, 'info');
    };
    
    // Перехватываем console.error
    const originalConsoleError = console.error;
    console.error = function() {
        // Вызываем оригинальный метод
        originalConsoleError.apply(console, arguments);
        
        // Формируем сообщение для логирования
        const message = Array.from(arguments).map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        logToConsole(message, 'error');
    };
    
    // Инициализация основных компонентов
    // Initialize Feather icons
    feather.replace();
    
    // НЕ инициализируем определение наведения мыши для сайдбара здесь
    // Это будет сделано только после входа в конференцию
    
    // DOM elements
    const joinAsPlayerBtn = document.getElementById('join-as-player-btn');
    const joinAsHostBtn = document.getElementById('join-as-host-btn');
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
    const reviveAllBtn = document.getElementById('revive-all-btn');
    const balaganBtn = document.getElementById('balagan-btn');
    const timer60SecBtn = document.getElementById('timer-60sec-btn');
    const timer30SecBtn = document.getElementById('timer-30sec-btn');

    const timerContainer = document.getElementById('timer-container');
    const timerDisplay = document.getElementById('timer-display');
    let currentTimerInterval = null; // Для хранения текущего активного интервала таймера
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
    const randomizePlayerOrderBtn = document.getElementById('randomize-player-order-btn');

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
    let userRole = 'player'; // Роль пользователя ('player' или 'host')
    let userOrderIndex = 0; // Порядковый номер пользователя (для сортировки видео)
    let localVideoSlotIndex = null; // Индекс слота для локального видео
    
    // Список доступных камер и выбранная камера
    let availableCameras = [];
    let selectedCameraId = '';
    
    // Переменные для автоматической настройки битрейта
    window.autoAdjustBitrate = true;  // По умолчанию автоматически подстраивать битрейт
    window.recommendedBitrate = 300;  // Начальное значение рекомендуемого битрейта
    
    // Переменные для сохранения пользовательских настроек видео
    window.manuallySelectedQuality = null; // Качество, выбранное пользователем
    window.videoConstraintsApplied = false; // Статус применения ограничений видео
    
    // Загружаем сохраненные настройки из localStorage при загрузке страницы
    try {
        // Загружаем выбранное качество видео
        const savedQuality = localStorage.getItem('userSelectedVideoQuality');
        if (savedQuality) {
            window.manuallySelectedQuality = savedQuality;
            console.log(`ЗАГРУЖЕНО ИЗ ХРАНИЛИЩА: Выбранное пользователем качество видео = ${savedQuality}`);
        } else {
            // Устанавливаем качество по умолчанию как sd (480p), если ничего не сохранено
            window.manuallySelectedQuality = 'sd';
            localStorage.setItem('userSelectedVideoQuality', 'sd');
            console.log(`НЕТ СОХРАНЕННОГО КАЧЕСТВА: Установлено качество по умолчанию - sd (480p)`);
        }
        
        // Загружаем ID выбранной камеры
        const savedCameraId = localStorage.getItem('selectedCameraId');
        if (savedCameraId) {
            selectedCameraId = savedCameraId;
            console.log(`ЗАГРУЖЕНО ИЗ ХРАНИЛИЩА: ID выбранной камеры = ${savedCameraId}`);
        }
        
        // Загружаем сохраненные настройки видео (ширина, высота, битрейт)
        const savedVideoSettings = localStorage.getItem('videoSettings');
        if (savedVideoSettings) {
            window.selectedVideoSettings = JSON.parse(savedVideoSettings);
            console.log(`ЗАГРУЖЕНО ИЗ ХРАНИЛИЩА: Настройки видео =`, window.selectedVideoSettings);
        }
    } catch (e) {
        console.error("Ошибка при загрузке настроек из localStorage:", e);
    }
    
    
    // Локальные переименования других пиров (видны только пользователю)
    const localPeerNames = new Map();
    // Информация о пирах
    const peers = new Map();
    
    // Сохраняем выбранное качество и камеру глобально
    window.lastSelectedQuality = 'sd'; // По умолчанию SD 480p
    
    // Настройки качества видео по умолчанию (оптимизировано для низкой скорости интернета)
    const videoQualityPresets = {
        sd: { width: 640, height: 480, bitrate: 800 },      // 480p
        hd: { width: 1280, height: 720, bitrate: 1500 },     // 720p
        fullhd: { width: 1920, height: 1080, bitrate: 3000 } // 1080p
    };
    
    // Словарь для маппинга между значениями селектора и идентификаторами качества
    // Это нужно для правильного сохранения выбора пользователя
    const qualityMappings = {
        // Значения из селектора -> стандартизированные ключи для videoQualityPresets
        "sd": "sd",           // 480p
        "hd": "hd",           // 720p
        "fullhd": "fullhd",   // 1080p
        // Хотя селектор использует те же значения, добавим для явности
        "480p": "sd",
        "720p": "hd",
        "1080p": "fullhd"
    };
    
    // Проверка поддержки запрошенного разрешения, с постепенным fallback на более низкое
    async function getValidVideoConstraints(requestedWidth, requestedHeight) {
        console.log(`Applying exact resolution constraints ${requestedWidth}x${requestedHeight}`);
        window.appLogs.push({
            timestamp: new Date().toISOString(),
            message: `Applying exact resolution constraints ${requestedWidth}x${requestedHeight}`
        });
        
        // Пробуем с точными (exact) ограничениями для максимальной точности
        let exactConstraints = {
            width: { exact: requestedWidth },
            height: { exact: requestedHeight },
            facingMode: 'user'
        };
        
        // Добавляем выбор камеры, если она указана
        if (selectedCameraId) {
            exactConstraints.deviceId = { exact: selectedCameraId };
            console.log("Using exact deviceId constraint for maximum precision");
            window.appLogs.push({
                timestamp: new Date().toISOString(),
                message: `Using exact deviceId constraint for camera ${selectedCameraId}`
            });
        }
        
        try {
            console.log('Testing with exact constraints:', JSON.stringify(exactConstraints));
            const testStream = await navigator.mediaDevices.getUserMedia({
                video: exactConstraints,
                audio: false
            });
            
            // Проверим реальное разрешение
            const videoTrack = testStream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            
            console.log('Test stream with exact constraints succeeded:', settings);
            window.appLogs.push({
                timestamp: new Date().toISOString(),
                message: `Test stream with exact constraints succeeded: ${JSON.stringify(settings)}`
            });
            
            testStream.getTracks().forEach(track => track.stop());
            
            // Возвращаем точные ограничения, так как они работают
            return exactConstraints;
        } catch (error) {
            console.log('Error testing exact resolution, trying with flexible constraints:', error.message);
            window.appLogs.push({
                timestamp: new Date().toISOString(),
                message: `Error testing exact resolution: ${error.message}, trying with flexible constraints`
            });
            
            // Если точные ограничения не работают, пробуем более гибкие
            try {
                const flexibleConstraints = {
                    width: { ideal: requestedWidth },
                    height: { ideal: requestedHeight },
                    facingMode: 'user'
                };
                
                console.log('Testing with flexible constraints:', JSON.stringify(flexibleConstraints));
                const backupStream = await navigator.mediaDevices.getUserMedia({
                    video: flexibleConstraints,
                    audio: false
                });
                
                const videoTrack = backupStream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                
                console.log('Flexible constraints test succeeded with settings:', settings);
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `Flexible constraints test succeeded: ${JSON.stringify(settings)}`
                });
                
                backupStream.getTracks().forEach(track => track.stop());
                
                return flexibleConstraints;
            } catch (fallbackError) {
                console.error('Even flexible constraints failed:', fallbackError.message);
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `Even flexible constraints failed: ${fallbackError.message}, using basic constraints`
                });
                
                // Возвращаем самые базовые настройки, которые должны работать на большинстве устройств
                return {
                    facingMode: 'user'
                };
            }
        }
    }
    
    // Флаг для отслеживания, были ли применены настройки разрешения видео
    let videoConstraintsApplied = false;
    
    // Текущие настройки видео для пиров (ID пира -> настройки)
    const peerVideoSettings = new Map();
    
    // ID текущего пира для изменения настроек видео
    let currentSettingsPeerId = null; // ID пира для текущих настроек в контекстном меню
    
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
                let preset = 'sd';
                if (settings.width) {
                    if (settings.width <= 480) preset = 'sd';
                    else if (settings.width <= 720) preset = 'hd';
                    else preset = 'fullhd';
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
            console.log(`Выбрано качество в селекторе: ${selectedQuality}`);
            
            // ВАЖНОЕ ИЗМЕНЕНИЕ: Сохраняем выбранное пользователем качество
            // в глобальной переменной для оперативного использования и в localStorage для долгосрочного хранения
            // Стандартизируем значение для сохранения 
            const standardizedQuality = qualityMappings[selectedQuality] || selectedQuality;
            
            window.manuallySelectedQuality = standardizedQuality;
            localStorage.setItem('userSelectedVideoQuality', standardizedQuality);
            console.log(`ВАЖНО: Сохраняем выбор пользователя: ${selectedQuality} (стандартизировано как ${standardizedQuality}) в глобальную переменную и localStorage`);
            
            if (localCustomVideoSettings) {
                localCustomVideoSettings.style.display = selectedQuality === 'custom' ? 'block' : 'none';
            }
            
            if (selectedQuality !== 'custom') {
                // Установить значения из пресета
                const preset = videoQualityPresets[selectedQuality];
                if (preset) {
                    if (localVideoWidthInput) {
                        localVideoWidthInput.value = preset.width;
                        console.log(`Установлена ширина: ${preset.width} в соответствии с качеством ${selectedQuality}`);
                    }
                    if (localVideoHeightInput) {
                        localVideoHeightInput.value = preset.height;
                        console.log(`Установлена высота: ${preset.height} в соответствии с качеством ${selectedQuality}`);
                    }
                    if (localVideoBitrateInput) localVideoBitrateInput.value = preset.bitrate;
                    if (localVideoBitrateSlider) localVideoBitrateSlider.value = preset.bitrate;
                    if (localBitrateValue) localBitrateValue.textContent = `${preset.bitrate} kbps`;
                }
            }
        });
    }
    
    // Функция для проверки поддерживаемых разрешений камеры
    async function updateVideoQualityOptions() {
        if (!cameraSelect || !localVideoQualitySelect) return;

        // Получаем выбранное устройство
        const deviceId = cameraSelect.value || selectedCameraId;
        if (!deviceId) return;

        console.log("Проверка поддержки разрешений для камеры ID:", deviceId);

        try {
            // Проверяем поддержку 1080p
            let supportsFullHD = true;
            try {
                // Пытаемся открыть камеру с разрешением 1080p
                const testStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: deviceId },
                        width: { exact: 1920 },
                        height: { exact: 1080 }
                    },
                    audio: false
                });
                
                // Если успешно, закрываем поток
                testStream.getTracks().forEach(track => track.stop());
                console.log("Камера поддерживает Full HD (1080p)");
            } catch (error) {
                console.log("Камера НЕ поддерживает Full HD (1080p):", error.message);
                supportsFullHD = false;
            }
            
            // Обновляем доступные опции в выпадающем списке
            // Сначала получаем все существующие опции
            const options = Array.from(localVideoQualitySelect.options);
            
            // Находим опцию Full HD
            const fullHDOption = options.find(opt => opt.value === 'fullhd');
            
            if (fullHDOption) {
                // Если камера не поддерживает 1080p, скрываем эту опцию
                fullHDOption.disabled = !supportsFullHD;
                fullHDOption.style.display = supportsFullHD ? '' : 'none';
                
                // Если текущая выбранная опция - fullhd, но камера не поддерживает его,
                // переключаемся на HD 720p
                if (localVideoQualitySelect.value === 'fullhd' && !supportsFullHD) {
                    localVideoQualitySelect.value = 'hd';
                    // Имитируем событие change, чтобы обновились соответствующие поля
                    localVideoQualitySelect.dispatchEvent(new Event('change'));
                }
            }
            
            // Сохраняем результат проверки поддержки 1080p для этой камеры
            if (!window.cameraCapabilities) {
                window.cameraCapabilities = {};
            }
            window.cameraCapabilities[deviceId] = { supportsFullHD };
            console.log("Сохранена информация о поддержке 1080p для камеры:", deviceId, supportsFullHD);
            
        } catch (error) {
            console.error("Ошибка при проверке поддерживаемых разрешений:", error);
        }
    }
    
    // Добавляем обработчик события выбора камеры
    if (cameraSelect) {
        cameraSelect.addEventListener('change', async () => {
            if (cameraSelect.value) {
                selectedCameraId = cameraSelect.value;
                console.log("Камера изменена, новый ID:", selectedCameraId);
                
                // Сохраняем выбранную камеру в localStorage
                try {
                    localStorage.setItem('selectedCameraId', selectedCameraId);
                    console.log("Сохранен ID выбранной камеры в localStorage:", selectedCameraId);
                } catch (e) {
                    console.error("Ошибка при сохранении ID камеры в localStorage:", e);
                }
                
                // Сбрасываем ранее выбранную опцию 1080p, если новая камера её не поддерживает
                if (localVideoQualitySelect && localVideoQualitySelect.value === 'fullhd') {
                    // Проверяем, есть ли у нас уже информация о поддержке 1080p для этой камеры
                    let supportsFullHD = true;
                    if (window.cameraCapabilities && window.cameraCapabilities[selectedCameraId]) {
                        supportsFullHD = window.cameraCapabilities[selectedCameraId].supportsFullHD;
                    }
                    
                    // Если камера не поддерживает 1080p, переключаемся на 720p
                    if (!supportsFullHD) {
                        console.log("Выбранная камера не поддерживает 1080p, переключаемся на 720p");
                        localVideoQualitySelect.value = 'hd';
                        // Имитируем событие change, чтобы обновились соответствующие поля
                        localVideoQualitySelect.dispatchEvent(new Event('change'));
                    }
                }
                
                // Обновляем доступные опции качества для выбранной камеры
                await updateVideoQualityOptions();
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
    
    // Функция для применения настроек локального видео
    // Создаем отдельную функцию, которую можно вызывать и из кнопки, и из кода
    async function applyLocalVideoSettings(settings = null) {
        try {
            console.log("Применяем настройки видео", settings ? "из аргумента" : "из формы");
            
            // Если настройки не предоставлены, берем их из формы
            if (!settings) {
                if (!localVideoQualitySelect) return;
                
                const selectedQuality = localVideoQualitySelect.value;
                let bitrate = 0;
                
                // Стандартизируем значение качества для сохранения
                const standardizedQuality = qualityMappings[selectedQuality] || selectedQuality;
                
                // Сохраняем выбранное пользователем качество в глобальной переменной
                window.manuallySelectedQuality = standardizedQuality;
                
                try {
                    // Сохраняем выбор пользователя в localStorage
                    localStorage.setItem('userSelectedVideoQuality', standardizedQuality);
                    console.log(`СОХРАНЕНО В ЛОКАЛЬНОЕ ХРАНИЛИЩЕ: качество видео = ${standardizedQuality} (из выбранного ${selectedQuality})`);
                } catch (e) {
                    console.error("Не удалось сохранить настройки в localStorage:", e);
                }
                
                // Сохраняем выбранную камеру
                let newCameraId = null;
                if (cameraSelect && cameraSelect.value) {
                    newCameraId = cameraSelect.value;
                    console.log("Выбрана камера:", newCameraId);
                    
                    // Сохраняем выбранную камеру в localStorage
                    try {
                        localStorage.setItem('selectedCameraId', newCameraId);
                    } catch (e) {
                        console.error("Не удалось сохранить ID камеры в localStorage:", e);
                    }
                }
                
                if (selectedQuality === 'custom') {
                    if (!localVideoWidthInput || !localVideoHeightInput || !localVideoBitrateInput) return;
                    
                    const width = parseInt(localVideoWidthInput.value, 10);
                    const height = parseInt(localVideoHeightInput.value, 10);
                    bitrate = parseInt(localVideoBitrateInput.value, 10);
                    
                    // Настройки для применения
                    settings = {
                        width: width,
                        height: height,
                        bitrate: bitrate,
                        quality: 'custom',
                        deviceId: newCameraId || selectedCameraId
                    };
                } else {
                    const preset = videoQualityPresets[selectedQuality];
                    
                    // Настройки для применения
                    settings = {
                        width: preset.width,
                        height: preset.height,
                        bitrate: preset.bitrate,
                        quality: selectedQuality,
                        deviceId: newCameraId || selectedCameraId
                    };
                    
                    // Проверяем совместимость камеры с выбранным разрешением
                    if (window.cameraCapabilities && settings.deviceId) {
                        const capabilities = window.cameraCapabilities[settings.deviceId];
                        if (capabilities && selectedQuality === 'fullhd' && !capabilities.supportsFullHD) {
                            console.warn("Камера не поддерживает 1080p, переключаемся на 720p!");
                            const preset720p = videoQualityPresets.hd;
                            
                            settings = {
                                width: preset720p.width,
                                height: preset720p.height, 
                                bitrate: preset720p.bitrate,
                                quality: 'hd',
                                deviceId: settings.deviceId
                            };
                            
                            // Обновляем значение в localStorage
                            try {
                                localStorage.setItem('userSelectedVideoQuality', 'sd');
                                window.manuallySelectedQuality = 'sd';
                            } catch (e) {
                                console.error("Не удалось обновить настройки в localStorage:", e);
                            }
                        }
                    }
                }
            }
            
            // Сохраняем настройки видео для будущего использования
            window.selectedVideoSettings = {
                width: settings.width,
                height: settings.height,
                bitrate: settings.bitrate,
                quality: settings.quality
            };
            
            // Сохраняем также в localStorage
            try {
                localStorage.setItem('videoSettings', JSON.stringify(window.selectedVideoSettings));
            } catch (e) {
                console.error("Не удалось сохранить настройки видео в localStorage:", e);
            }
            
            console.log("Применяем настройки видео:", window.selectedVideoSettings);
            
            // Сохраняем битрейт для будущего использования
            window.customBitrate = settings.bitrate;
            
            try {
                // Остановить текущий стрим, если он существует
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                }
                
                // Создаем новые видео настройки с выбранной камерой
                // ВАЖНОЕ ИЗМЕНЕНИЕ: Принудительно устанавливаем 480p по умолчанию
                // Игнорируем settings и используем значения из SD-пресета
                const sdPreset = videoQualityPresets.sd;
                console.log("ПРИНУДИТЕЛЬНО ПРИМЕНЯЕМ НАСТРОЙКИ SD (480p):", JSON.stringify(sdPreset));
                
                const videoConstraints = {
                    width: { ideal: sdPreset.width },
                    height: { ideal: sdPreset.height }
                };
                
                if (settings.deviceId) {
                    videoConstraints.deviceId = { exact: settings.deviceId };
                    selectedCameraId = settings.deviceId;
                    console.log("Применяем настройки к камере:", selectedCameraId);
                }
                
                console.log("Итоговые настройки видео:", JSON.stringify(videoConstraints));
                
                // Сбросим флаг применения настроек видео
                videoConstraintsApplied = false;
                
                // Запрашиваем новый видеопоток
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false
                });
                
                console.log("Настройки видео успешно применены!");
                
                // Заменить локальный стрим
                localStream = newStream;
                
                // Отмечаем, что настройки видео были применены
                videoConstraintsApplied = true;
                
                // Получаем и выводим в лог фактические настройки потока
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    const trackSettings = videoTrack.getSettings();
                    console.log("Фактические настройки применённого видеопотока:", trackSettings);
                }
                
                if (localVideo) {
                    // Обновить видео элемент
                    const videoElement = localVideo.querySelector('video');
                    if (videoElement) {
                        videoElement.srcObject = newStream;
                    }
                }
                
                // Обновить видео треки во всех peer connections
                // Принудительно используем битрейт SD пресета
                updateVideoTracksInPeerConnections(videoQualityPresets.sd.bitrate);
                
                // Закрыть модальное окно, если оно открыто
                if (localVideoSettingsModal) {
                    localVideoSettingsModal.hide();
                }
                
                // Устанавливаем значение селектора качества видео, если оно существует
                if (localVideoQualitySelect && settings.quality) {
                    if (localVideoQualitySelect.value !== settings.quality) {
                        localVideoQualitySelect.value = settings.quality;
                        console.log(`Установлено качество в селекторе: ${settings.quality}`);
                    }
                }
                
                return true; // Успешное применение настроек
            } catch (error) {
                console.error('Ошибка применения настроек видео:', error);
                showError(`Не удалось применить настройки видео: ${error.message}`);
                return false;
            }
        } catch (error) {
            console.error('Неожиданная ошибка в applyLocalVideoSettings:', error);
            showError(`Произошла ошибка: ${error.message}`);
            return false;
        }
    }
    
    // Привязываем функцию к кнопке применения настроек
    if (applyLocalVideoSettingsBtn) {
        applyLocalVideoSettingsBtn.addEventListener('click', () => {
            applyLocalVideoSettings();
        });
    }
    
    // Функция для обновления видео треков во всех peer connections
    function updateVideoTracksInPeerConnections(bitrate) {
        if (!localStream) {
            console.warn('Cannot update video tracks: no local stream available');
            return;
        }
        
        const videoTrack = localStream.getVideoTracks()[0];
        if (!videoTrack) {
            console.warn('No video track found in local stream');
            return;
        }
        
        // ПРИНУДИТЕЛЬНО УСТАНАВЛИВАЕМ SD КАЧЕСТВО В LOCAL STORAGE
        window.manuallySelectedQuality = 'sd';
        localStorage.setItem('userSelectedVideoQuality', 'sd');
        console.log("ПРИНУДИТЕЛЬНО УСТАНОВЛЕНО КАЧЕСТВО SD (480P) В ХРАНИЛИЩЕ");
        
        // Проверяем, были ли успешно применены видео ограничения
        const settings = videoTrack.getSettings();
        console.log("Current video track settings:", settings);
        
        // Добавляем в лог для отладки
        window.appLogs.push({
            timestamp: new Date().toISOString(),
            message: `Current video track settings: ${JSON.stringify(settings)}`
        });
        
        // Обновляем отображение текущего разрешения под селектором
        const currentResolutionDisplay = document.getElementById('current-resolution-display');
        const currentBitrateInfo = document.getElementById('current-bitrate-info');
        
        if (currentResolutionDisplay && settings.width && settings.height) {
            // Преобразуем размеры в название разрешения (480p, 720p, 1080p)
            let resolutionText = '';
            if (settings.height <= 480) {
                resolutionText = '480p';
            } else if (settings.height <= 720) {
                resolutionText = '720p';
            } else {
                resolutionText = '1080p';
            }
            currentResolutionDisplay.textContent = resolutionText;
        }
        
        // Обновляем отображение текущего битрейта
        if (currentBitrateInfo) {
            currentBitrateInfo.textContent = `${bitrate} кбіт/с`;
        }
        
        // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Полностью отключаем автоматическое определение качества
        // и сохраняем только отладочную информацию
        if (localVideoQualitySelect && settings.width && settings.height) {
            const currentQuality = localVideoQualitySelect.value;
            console.log(`Текущее качество видео в селекторе: ${currentQuality}`);
            console.log(`Фактическое разрешение видео: ${settings.width}x${settings.height}`);
            
            // НЕ МЕНЯЕМ автоматически выбранное качество, используем только то, что выбрал пользователь
            // РАДИКАЛЬНОЕ ИЗМЕНЕНИЕ: Полностью отключаем всю логику автоматического
            // определения качества видео и используем только пользовательский выбор
            // Нет логики автоопределения - только пользовательские настройки
            
            // Проверяем, есть ли сохранённое пользовательское качество
            if (window.manuallySelectedQuality) {
                console.log(`Сохраненный пользовательский выбор качества: ${window.manuallySelectedQuality}`);
                // Если текущее качество в селекторе отличается от сохраненного,
                // восстанавливаем сохраненное пользователем качество
                if (localVideoQualitySelect.value !== window.manuallySelectedQuality) {
                    console.log(`Восстанавливаем пользовательский выбор качества в селекторе: ${window.manuallySelectedQuality}`);
                    localVideoQualitySelect.value = window.manuallySelectedQuality;
                }
            } 
            // Если нет в глобальной переменной, проверяем localStorage
            else if (localStorage.getItem('userSelectedVideoQuality')) {
                const savedQuality = localStorage.getItem('userSelectedVideoQuality');
                console.log(`Загружаем сохраненное качество из localStorage: ${savedQuality}`);
                
                // Устанавливаем в глобальную переменную для текущей сессии
                window.manuallySelectedQuality = savedQuality;
                
                // Установить сохраненное качество в селекторе
                if (localVideoQualitySelect.value !== savedQuality) {
                    localVideoQualitySelect.value = savedQuality;
                    console.log(`Установлено сохраненное качество в селекторе: ${savedQuality}`);
                }
            }
            // Если нет сохраненного пользовательского выбора, НЕ ДЕЛАЕМ автоопределение,
            // оставляем текущее значение в селекторе
        }
        
        // Проверяем соответствие ожидаемому разрешению
        if (!videoConstraintsApplied) {
            console.warn("Video constraints were not applied successfully. Trying to reapply.");
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
    
    // Функция генерации случайного имени из букв и цифр
    function generateRandomUsername() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digits = '0123456789';
        
        let result = '';
        
        // Генерируем 4 случайные буквы
        for (let i = 0; i < 4; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        // Добавляем 3 случайные цифры
        for (let i = 0; i < 3; i++) {
            result += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        
        return result;
    }

    // Роль пользователя уже определена ранее (player или host)
    
    // Обработчики кнопок входа с ролями
    if (joinAsPlayerBtn) {
        joinAsPlayerBtn.addEventListener('click', async () => {
            // Генерируем случайное имя пользователя
            username = generateRandomUsername();
            roomname = 'default'; // Всегда используем комнату default
            videoEnabled = true;  // Всегда включаем видео
            userRole = 'player';  // Устанавливаем роль игрока
            
            // Убедимся, что кнопка сайдбара скрыта
            if (sidebarToggleBtn) {
                sidebarToggleBtn.style.display = 'none';
            }
            
            await joinConference();
        });
    }
    
    if (joinAsHostBtn) {
        joinAsHostBtn.addEventListener('click', async () => {
            // Генерируем случайное имя пользователя
            username = generateRandomUsername();
            roomname = 'default'; // Всегда используем комнату default
            videoEnabled = true;  // Всегда включаем видео
            userRole = 'host';    // Устанавливаем роль ведущего
            
            // Убедимся, что кнопка сайдбара скрыта
            if (sidebarToggleBtn) {
                sidebarToggleBtn.style.display = 'none';
            }
            
            await joinConference();
        });
    }
    
    // Функция для подключения к конференции
    async function joinConference() {
        // Применяем все необходимые стили к conference-section сразу
        const conferenceSection = document.getElementById('conference-section');
        if (conferenceSection) {
            conferenceSection.style.display = 'flex'; // Устанавливаем flex вместо block
            conferenceSection.style.margin = '0';
            conferenceSection.style.padding = '0'; 
            conferenceSection.style.height = '100vh';
            conferenceSection.style.overflow = 'hidden';
        }
        
        // Скрываем секцию логина
        const loginSection = document.getElementById('login-section');
        if (loginSection) {
            loginSection.style.display = 'none';
        }
        
        // Настраиваем определение наведения мыши для показа кнопки сайдбара
        // только после присоединения к конференции
        setupSidebarHoverDetection();
        
        // Показываем сайдбар и кнопку сайдбара
        const controlSidebar = document.getElementById('control-sidebar');
        if (controlSidebar) {
            controlSidebar.style.display = 'block';
        }
        
        const sidebarToggleBtn = document.getElementById('sidebar-toggle');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.style.display = 'block';
        }
        
        console.log("Инициализация видео в joinConference");
        
        // Задаем настройки видео в зависимости от сохраненных предпочтений пользователя
        // Если пользователь уже выбирал качество, используем его
        let preset = videoQualityPresets.sd; // По умолчанию SD 480p
        
        // Проверяем сохраненное в localStorage или глобальных переменных качество
        const savedQuality = window.manuallySelectedQuality || localStorage.getItem('userSelectedVideoQuality');
        if (savedQuality && videoQualityPresets[savedQuality]) {
            preset = videoQualityPresets[savedQuality];
            console.log(`ИСПОЛЬЗУЕМ СОХРАНЕННОЕ КАЧЕСТВО: ${savedQuality} с параметрами ${preset.width}x${preset.height}`);
            
            // Также обновляем глобальную переменную для будущего использования
            window.manuallySelectedQuality = savedQuality;
        }
        
        // Используем ideal вместо exact для лучшей совместимости с разными камерами
        // При этом браузер будет стремиться к нашему разрешению, но сможет выбрать 
        // ближайшее поддерживаемое, если точное не поддерживается
        let videoConstraints = {
            width: { ideal: preset.width },  // Используем ideal для лучшей совместимости
            height: { ideal: preset.height }, // Используем ideal для лучшей совместимости
            facingMode: 'user'
        };
        
        console.log('Setting video constraints with exact parameters:', videoConstraints);
        window.appLogs.push({
            timestamp: new Date().toISOString(),
            message: `Setting video constraints with exact resolution: ${JSON.stringify(videoConstraints)}`
        });
            
        // Сохраняем битрейт для будущего использования
        window.customBitrate = preset.bitrate;
        
        try {
            await setupLocalStream(videoConstraints);
            connectToGalene();
        } catch (error) {
            // В случае ошибки возвращаем секции в исходное состояние
            if (loginSection) loginSection.style.display = 'flex';
            if (conferenceSection) conferenceSection.style.display = 'none';
            
            showError(`Failed to access camera: ${error.message}. Please make sure your camera is connected and you've granted permission to use it.`);
        }
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
            // Используем try/catch, чтобы обрабатывать возможную ошибку доступа к камере
            try {
                await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            } catch (mediaError) {
                console.warn('Failed to get camera access for enumeration, will continue with limited information:', mediaError.message);
                // Продолжаем работу даже при ошибке доступа к камере
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            availableCameras = videoDevices;
            
            console.log('Available cameras:', availableCameras);
            
            // После получения списка камер, проверим их возможности
            try {
                await updateVideoQualityOptions();
            } catch (qualityError) {
                console.warn('Error checking camera capabilities:', qualityError.message);
                // Продолжаем работу даже при ошибке
            }
            
            // Селектор камеры при логине удален
            
            if (cameraSelect) {
                // Сохраним текущее значение
                const currentValue = cameraSelect.value;
                
                // Очистим выпадающий список
                cameraSelect.innerHTML = '';
                
                // Добавляем пустой элемент в начало для возможности явного выбора камеры
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.text = 'Оберіть камеру';
                cameraSelect.appendChild(emptyOption);
                
                if (videoDevices.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.text = 'Камери не знайдено';
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
                    } else if (videoDevices.length > 0) {
                        // Иначе выберем первую камеру или текущую выбранную в логине
                        cameraSelect.value = selectedCameraId || videoDevices[0].deviceId;
                    }
                }
            }
        } catch (error) {
            console.error('Error enumerating devices:', error);
            // Не позволяем ошибке перечисления устройств блокировать работу приложения
            // Просто продолжаем без списка камер
        }
    }
    
    // Загрузим список камер при загрузке страницы
    loadCameras();
    
    async function setupLocalStream(videoConstraints = null) {
        try {
            console.log('Setting up local video stream, video enabled:', videoEnabled);
            
            // ПОЛНОСТЬЮ НОВЫЙ ПОДХОД: ВСЕГДА ИСПОЛЬЗУЕМ SD (480p) НАСТРОЙКИ
            // ФИКСИРОВАННОЕ КАЧЕСТВО SD 480p
            // ИГНОРИРУЕМ ВХОДНЫЕ ПАРАМЕТРЫ
            
            // Переопределяем все настройки на SD (480p)
            const sdPreset = videoQualityPresets.sd;
            videoConstraints = {
                width: { exact: sdPreset.width },
                height: { exact: sdPreset.height }
            };
            console.log('ПРИНУДИТЕЛЬНО ИСПОЛЬЗУЕМ SD (480p):', JSON.stringify(videoConstraints));
            
            // Устанавливаем SD как выбранное качество
            localStorage.setItem('userSelectedVideoQuality', 'sd');
            window.manuallySelectedQuality = 'sd';
            
            let selectedQuality = 'sd'; // Всегда SD 480p
            
            // Важно: всегда используем формат с exact для точного разрешения
            if (videoConstraints) {
                console.log('Video constraints explicitly provided:', JSON.stringify(videoConstraints));
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `Explicit video constraints provided: ${JSON.stringify(videoConstraints)}`
                });
                
                // Проверяем наличие ограничений разрешения и преобразуем к ideal, если они есть в другом формате
                // Это улучшит совместимость с различными камерами
                if (videoConstraints.width && !videoConstraints.width.ideal && !videoConstraints.width.exact) {
                    console.log('Converting width constraint to ideal format for better compatibility');
                    const width = videoConstraints.width.min || videoConstraints.width.max || videoConstraints.width.exact || 640;
                    videoConstraints.width = { ideal: width };
                }
                
                if (videoConstraints.height && !videoConstraints.height.ideal && !videoConstraints.height.exact) {
                    console.log('Converting height constraint to ideal format for better compatibility');
                    const height = videoConstraints.height.min || videoConstraints.height.max || videoConstraints.height.exact || 480;
                    videoConstraints.height = { ideal: height };
                }
                
                // Преобразуем exact в ideal для лучшей совместимости
                if (videoConstraints.width && videoConstraints.width.exact) {
                    const exactWidth = videoConstraints.width.exact;
                    videoConstraints.width = { ideal: exactWidth };
                    console.log(`Converting exact width ${exactWidth} to ideal format for better compatibility`);
                }
                
                if (videoConstraints.height && videoConstraints.height.exact) {
                    const exactHeight = videoConstraints.height.exact;
                    videoConstraints.height = { ideal: exactHeight };
                    console.log(`Converting exact height ${exactHeight} to ideal format for better compatibility`);
                }
            } else {
                console.log('No explicit video constraints, using defaults with ideal parameters for better compatibility');
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `No explicit video constraints, using defaults for 480p with ideal parameters`
                });
                
                // Если ограничения не указаны, создаем их с ideal вместо exact для лучшей совместимости
                videoConstraints = {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                };
            }
            
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
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            };
            
            // Добавляем логи для отладки
            console.log('setupLocalStream: Using these constraints:', JSON.stringify(deviceConstraints));
            window.appLogs.push({
                timestamp: new Date().toISOString(),
                message: `setupLocalStream: Using these constraints: ${JSON.stringify(deviceConstraints)}`
            });
            
            // Добавим выбор устройства, если оно указано
            if (selectedCameraId) {
                console.log("Используем сохраненную камеру в setupLocalStream:", selectedCameraId);
                // Using exact for maximum precision in camera selection
                deviceConstraints.deviceId = { exact: selectedCameraId };
                console.log("Using exact deviceId constraint for maximum precision in setupLocalStream");
            }
            
            const constraints = {
                video: videoEnabled ? deviceConstraints : false,
                audio: false // No audio per requirements
            };
            
            // Сбросим флаг применения настроек видео
            videoConstraintsApplied = false;
            
            try {
                console.log('Requesting media with constraints:', constraints);
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('Successfully obtained media stream with tracks:', 
                    stream.getTracks().map(t => `${t.kind}:${t.label}:${t.enabled}`));
                
                // Проверяем и логируем полученные настройки видео
                let videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                    const actualSettings = videoTrack.getSettings();
                    console.log('Actual video settings after getUserMedia:', actualSettings);
                    window.appLogs.push({
                        timestamp: new Date().toISOString(),
                        message: `Actual video settings after getUserMedia: ${JSON.stringify(actualSettings)}`
                    });
                    
                    // Проверяем min/max или exact параметры
                    let requestedWidth = null;
                    let requestedHeight = null;
                    
                    if (constraints.video) {
                        if (constraints.video.width) {
                            requestedWidth = constraints.video.width.ideal || 
                                constraints.video.width.exact || 
                                constraints.video.width.min;
                        }
                        
                        if (constraints.video.height) {
                            requestedHeight = constraints.video.height.ideal || 
                                constraints.video.height.exact || 
                                constraints.video.height.min;
                        }
                    }
                    
                    if (requestedWidth && actualSettings.width !== requestedWidth) {
                        console.warn(`Requested width ${requestedWidth} but got ${actualSettings.width}`);
                        window.appLogs.push({
                            timestamp: new Date().toISOString(),
                            message: `WARNING: Requested width ${requestedWidth} but got ${actualSettings.width}`
                        });
                    }
                    
                    if (requestedHeight && actualSettings.height !== requestedHeight) {
                        console.warn(`Requested height ${requestedHeight} but got ${actualSettings.height}`);
                        window.appLogs.push({
                            timestamp: new Date().toISOString(),
                            message: `WARNING: Requested height ${requestedHeight} but got ${actualSettings.height}`
                        });
                    }
                }
                if (videoTrack && videoTrack.getSettings) {
                    const settings = videoTrack.getSettings();
                    if (settings.deviceId && cameraSelect) {
                        selectedCameraId = settings.deviceId;
                        console.log(`Updating camera select to match current camera: ${settings.deviceId}`);
                        // Если есть селектор камеры, обновляем выбранное значение
                        if (cameraSelect.querySelector(`option[value="${settings.deviceId}"]`)) {
                            cameraSelect.value = settings.deviceId;
                        }
                    }
                }
                
                // Отмечаем, что настройки видео были применены
                videoConstraintsApplied = true;
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
            localVideo.className = 'video-item local-video';
            // Вместо добавления класса host, сразу включаем роль в текст
            const roleText = userRole === 'host' ? ` (ведучий)` : '';
            console.log(`DEBUG: Creating local video with role ${userRole}, roleText="${roleText}"`);
            
            // Добавляем кнопку убито только если это не ведущий
            const killButtonHtml = userRole === 'host' ? '' : '<button class="kill-button" id="kill-toggle-btn" title="Вбито">💀</button>';
            
            // Добавляем ангелочка/череп, который будет виден всем, когда пользователь "убит"/"жив" (начальное состояние зависит от isKilled)
            const angelButtonHtml = `<button class="kill-button${isKilled ? ' angel-icon' : ''}" style="${isKilled ? '' : 'display: none;'}" title="Вбито">${isKilled ? '👼' : '💀'}</button>`;
            
            localVideo.innerHTML = `
                <video autoplay muted playsinline></video>
                <div class="video-label" id="local-username-label">You (${username})${roleText}</div>
                ${killButtonHtml}
                ${angelButtonHtml}
                <button class="hand-emoji-button" title="Показать всем на 1 секунду">👋</button>
            `;
            
            // Настраиваем атрибуты для drag-n-drop если мы ведущий
            if (userRole === 'host') {
                // Ведущий не может быть перетаскиваемым
                localVideo.setAttribute('draggable', 'false');
            } else {
                // Игроки могут быть перетаскиваемы ведущим
                localVideo.classList.add('can-drag');
            }
            
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
            
            // Add local video to the grid - всегда вставляем в начало
            videoContainer.insertBefore(localVideo, videoContainer.firstChild);
            
            // Добавляем обработчик события для кнопки "вбито"
            const killButton = localVideo.querySelector('.kill-button');
            if (killButton) {
                killButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleKilledStatus();
                });
            }
            
            // Добавляем обработчик клика по кнопке эмодзи ладони только для локального видео
            const handEmojiBtn = localVideo.querySelector('.hand-emoji-button');
            if (handEmojiBtn) {
                handEmojiBtn.addEventListener('click', function() {
                    // Для убитых пользователей кнопка будет визуально отключена через CSS
                    // pointer-events: none добавляется через CSS
                    // Но все равно делаем дополнительную проверку
                    if (!isKilled) {
                        // Отправляем сообщение о клике на эмодзи ладони
                        sendMessage({
                            type: 'hand_emoji'
                        });
                        
                        console.log('Hand emoji button clicked');
                    } else {
                        console.log('Hand emoji button clicked, but user is killed');
                    }
                });
            }
            
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
                password: '',
                role: userRole // Добавляем роль пользователя
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
            case 'camera_state':
                // Обработка сообщения об изменении состояния камеры удаленного пользователя
                if (message.id && peers.has(message.id)) {
                    console.log(`Peer ${message.id} camera state changed to ${message.enabled ? 'enabled' : 'disabled'}`);
                    
                    // Обновляем информацию о состоянии камеры в объекте пира
                    const peer = peers.get(message.id);
                    peer.cameraEnabled = message.enabled;
                    
                    // Обновляем отображение видео элемента
                    const videoItem = document.querySelector(`.video-item[data-peer-id="${message.id}"]`);
                    if (videoItem) {
                        if (message.enabled) {
                            videoItem.classList.remove('camera-disabled');
                        } else {
                            videoItem.classList.add('camera-disabled');
                        }
                        
                        // Обновляем кнопку включения/выключения камеры, если она есть
                        const toggleCameraBtn = videoItem.querySelector('.toggle-camera');
                        if (toggleCameraBtn) {
                            const cameraIcon = toggleCameraBtn.querySelector('.camera-icon');
                            if (cameraIcon) {
                                cameraIcon.textContent = message.enabled ? '📹' : '🚫';
                            }
                            if (message.enabled) {
                                toggleCameraBtn.classList.remove('camera-disabled');
                            } else {
                                toggleCameraBtn.classList.add('camera-disabled');
                            }
                        }
                    }
                }
                break;
            case 'slot_position_update':
                // Обновление позиции участника в сетке
                const targetPeerId = message.peerId;
                const targetSlotIndex = message.slotIndex;
                
                // Обновляем позицию в DOM
                if (targetPeerId === serverId) {
                    // Обновляем позицию локального видео
                    if (localVideo) {
                        localVideo.dataset.slotIndex = targetSlotIndex.toString();
                        // Сохраняем слот индекс отдельно для правильной сортировки
                        localVideoSlotIndex = targetSlotIndex;
                        console.log(`Updated local video slot to ${targetSlotIndex}`);
                    }
                } else {
                    // Обновляем позицию удаленного видео
                    const videoElement = document.getElementById(`remote-${targetPeerId}`);
                    if (videoElement) {
                        videoElement.dataset.slotIndex = targetSlotIndex.toString();
                        console.log(`Updated remote video ${targetPeerId} slot to ${targetSlotIndex}`);
                    }
                }
                
                // Пересортировываем видео элементы
                sortVideoElements();
                break;
                
            case 'server_resources':
                // Получаем информацию о ресурсах сервера и рекомендуемом битрейте
                console.log(`Server resources - CPU: ${(message.resources.cpuUsage * 100).toFixed(1)}%, Memory: ${(message.resources.memoryUsage * 100).toFixed(1)}%, Connections: ${message.resources.connections}, Recommended bitrate: ${message.resources.recommendedBitrate} kbps`);
                
                // Добавляем в лог для отладки
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `Server resources - CPU: ${(message.resources.cpuUsage * 100).toFixed(1)}%, Memory: ${(message.resources.memoryUsage * 100).toFixed(1)}%, Connections: ${message.resources.connections}, Recommended bitrate: ${message.resources.recommendedBitrate} kbps`
                });
                
                // Обновляем глобальную переменную для рекомендуемого битрейта
                window.recommendedBitrate = message.resources.recommendedBitrate;
                
                // Всегда автоматически применяем рекомендуемый битрейт без учета ручных настроек
                console.log(`Auto-adjusting bitrate to server recommended value: ${window.recommendedBitrate} kbps`);
                
                // Добавляем в лог для отладки
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `Auto-adjusting bitrate to server recommended value: ${window.recommendedBitrate} kbps`
                });
                
                // Устанавливаем новый битрейт для всех исходящих видеопотоков
                updateVideoTracksInPeerConnections(window.recommendedBitrate);
                
                // Обновляем переменную текущего битрейта
                window.customBitrate = window.recommendedBitrate;
                
                // Обновляем отображение текущего битрейта в сайдбаре
                const currentBitrateDisplay = document.getElementById('current-bitrate-display');
                if (currentBitrateDisplay) {
                    currentBitrateDisplay.value = window.recommendedBitrate;
                }
                
                // Обновляем отображение битрейта рядом с разрешением
                const currentBitrateInfo = document.getElementById('current-bitrate-info');
                if (currentBitrateInfo) {
                    currentBitrateInfo.textContent = `${window.recommendedBitrate} кбіт/с`;
                }
                break;
                
            case 'balagan':
                // Сервер сообщает о начале "Балагана" или таймера
                console.log(`Received balagan message with duration: ${message.duration} seconds`);
                const showAnimation = message.showAnimation !== undefined ? message.showAnimation : true;
                startTimer(message.duration || 60, showAnimation);
                break;
                
            case 'stop_balagan':
                // Сообщение о завершении "Балагана" - показываем уведомление
                console.log('Received stop_balagan message');
                
                // Показываем уведомление "Чічічі Стоп Балаган" если таймер уже не отображается
                if (timerContainer.style.display === 'none') {
                    const stopBalaganAnnouncement = document.getElementById('stop-balagan-announcement');
                    if (stopBalaganAnnouncement) {
                        stopBalaganAnnouncement.style.display = 'block';
                        stopBalaganAnnouncement.style.animation = 'stopBalaganAppear 0.5s forwards';
                        
                        // Через 1.5 секунды скрываем сообщение
                        setTimeout(() => {
                            stopBalaganAnnouncement.style.animation = 'stopBalaganDisappear 0.5s forwards';
                            
                            // После завершения анимации полностью убираем элемент
                            setTimeout(() => {
                                stopBalaganAnnouncement.style.display = 'none';
                                stopBalaganAnnouncement.style.animation = '';
                            }, 500);
                        }, 1500);
                    }
                }
                break;
                
            case 'balagan_confirmed':
                // Подтверждение для хоста, что сообщение о "Балагане" успешно разослано
                console.log('Balagan message confirmed by server');
                break;
                
            case 'revive_all_confirmed':
                // Подтверждение снятия статуса "вбито" со всех
                console.log(`Host revived ${message.count} participants`);
                // Никаких дополнительных действий не требуется, так как отдельные сообщения
                // user_killed будут обработаны для каждого пира
                break;
                
            case 'order_index_changed':
                // Порядковый номер пира изменен
                const peerWithChangedOrder = peers.get(message.id);
                if (peerWithChangedOrder) {
                    peerWithChangedOrder.orderIndex = message.orderIndex;
                    updatePeerLabel(message.id);
                    sortVideoElements();
                }
                break;
                
            case 'order_index_changed_confirmed':
                // Подтверждение изменения нашего порядкового номера
                if (message.id === serverId) {
                    userOrderIndex = message.orderIndex;
                    updateLocalLabel();
                    sortVideoElements();
                }
                break;
                
            case 'hand_emoji':
                // Пользователь нажал на эмодзи ладони
                if (message.id && peers.has(message.id)) {
                    console.log(`Peer ${message.id} clicked hand emoji`);
                    // Добавляем класс для анимации центрирования видео
                    const videoItem = document.querySelector(`.video-item[data-peer-id="${message.id}"]`);
                    if (videoItem) {
                        videoItem.classList.add('center-attention');
                    }
                }
                break;
                
            case 'hand_emoji_end':
                // Окончание показа центрированного видео
                if (message.id) {
                    console.log(`Hand emoji effect ended for peer ${message.id}`);
                    const videoItem = document.querySelector(`.video-item[data-peer-id="${message.id}"]`);
                    if (videoItem) {
                        videoItem.classList.remove('center-attention');
                    }
                }
                break;
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
                
                // Обновить роль пользователя в соответствии с подтверждением сервера
                userRole = message.role || 'player';
                // Сохраняем порядковый номер пользователя
                userOrderIndex = message.orderIndex || 0;
                console.log(`Joined as ${userRole} with order index ${userOrderIndex}`);
                console.log(`DEBUG: User role set to ${userRole}, this should be visible in the label`);
                
                // Не добавляем отдельный индикатор роли, отображаем её в имени
                // Обновить отображение имени в локальном видео
                updateLocalLabel();
                
                // Обновить название комнаты в сайдбаре
                updateRoomInfo(roomname);
                
                // Показать кнопку переключения сайдбара
                sidebarToggleBtn.style.display = 'block';
                
                // Показать раздел управления комнатой если пользователь - ведущий
                const hostControlsSection = document.getElementById('host-controls-section');
                if (hostControlsSection) {
                    hostControlsSection.style.display = userRole === 'host' ? 'block' : 'none';
                }
                
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
                            killed: user.killed || false,
                            role: user.role || 'player',
                            isHost: user.role === 'host',
                            orderIndex: user.orderIndex || 0
                        });
                        
                        // Инициировать соединение
                        initiateConnection(user.id);
                    }
                });
                
                // Обновить выпадающий список для переименования
                updatePeerSelect();
                
                // Пересортировать видео элементы по порядковым номерам
                sortVideoElements();
                
                // Показать секцию для переименования других участников только если есть другие участники
                renamePeerSection.style.display = peers.size > 0 ? 'block' : 'none';
                break;
                
            case 'user':
                if (message.kind === 'add' && message.id !== serverId) {
                    // Добавляем нового пира в список с информацией о роли
                    peers.set(message.id, {
                        id: message.id,
                        username: message.username,
                        killed: message.killed || false,
                        role: message.role || 'player',
                        isHost: message.isHost || false,
                        orderIndex: message.orderIndex || 0
                    });
                    
                    // Обновить выпадающий список для переименования
                    updatePeerSelect();
                    
                    // Пересортировать видео элементы по порядковым номерам
                    sortVideoElements();
                    
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
                    
                    // Пересортировать видео элементы по порядковым номерам
                    sortVideoElements();
                }
                break;
                
            case 'ice':
                // ICE candidate received
                if (peerConnections[message.id]) {
                    const pc = peerConnections[message.id];
                    const candidate = new RTCIceCandidate(message.candidate);
                    
                    // Проверяем, есть ли уже remote description
                    // Это ключевая проверка для избежания ошибки "The remote description was null"
                    if (pc.remoteDescription && pc.remoteDescription.type) {
                        pc.addIceCandidate(candidate)
                            .catch(error => console.error('Error adding ICE candidate:', error));
                    } else {
                        // Если remote description еще нет, сохраняем кандидатов для последующего добавления
                        console.log(`Remote description not set yet for ${message.id}, buffering ICE candidate`);
                        
                        // Создаем буфер для кандидатов если его еще нет
                        if (!pc.iceCandidatesBuffer) {
                            pc.iceCandidatesBuffer = [];
                        }
                        
                        // Сохраняем кандидата в буфер
                        pc.iceCandidatesBuffer.push(candidate);
                    }
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
                
            case 'kill_peer_confirmed':
                // Подтверждение, что ведущий изменил статус другого пира
                console.log(`Received confirmation for kill_peer: ${message.targetId} status: ${message.killed}`);
                break;
                
            case 'host_left':
                // Когда ведущий покидает комнату
                showError(message.message || "Ведущий покинул комнату");
                
                // Если мы игрок, отображаем возможность стать ведущим
                if (userRole === 'player') {
                    // Создаем кнопку стать ведущим
                    const becomeHostBtn = document.createElement('button');
                    becomeHostBtn.id = 'become-host-btn';
                    becomeHostBtn.className = 'btn btn-success';
                    becomeHostBtn.textContent = 'Стать ведущим';
                    becomeHostBtn.style.position = 'fixed';
                    becomeHostBtn.style.top = '10px';
                    becomeHostBtn.style.right = '10px';
                    becomeHostBtn.style.zIndex = '1000';
                    
                    becomeHostBtn.addEventListener('click', () => {
                        // Отправка запроса на изменение роли
                        userRole = 'host';
                        console.log("DEBUG: Role changed to host, updating label");
                        updateLocalLabel(); // Сразу обновим метку, не дожидаясь ответа сервера
                        
                        sendMessage({
                            type: 'join',
                            kind: 'join',
                            group: roomname,
                            username: username,
                            password: '',
                            role: 'host'
                        });
                        
                        // Убираем кнопку
                        becomeHostBtn.remove();
                    });
                    
                    document.body.appendChild(becomeHostBtn);
                }
                break;
        }
    }
    
    // Обновить отображение локального статуса "убит"
    function updateLocalKilledStatus() {
        if (localVideo) {
            // Для локального видео всегда добавляем класс local-video
            localVideo.classList.add('local-video');
            
            // Добавляем только маркер "ВБИТО" в левый верхний угол для локального видео,
            // и НЕ добавляем класс killed, чтобы не применять стили черного фона
            let killMark = localVideo.querySelector('.kill-mark');
            
            // Получаем кнопку закрытия сайдбара и ангелочка для локального видео
            const closeSidebarBtn = document.getElementById('close-sidebar');
            const angelButton = localVideo.querySelector('.kill-button');
            const handEmojiBtn = localVideo.querySelector('.hand-emoji-button');
            
            if (isKilled) {
                // Добавляем маркер, если его еще нет
                if (!killMark) {
                    killMark = document.createElement('div');
                    killMark.className = 'kill-mark';
                    killMark.textContent = 'ВБИТО';
                    localVideo.appendChild(killMark);
                }
                
                // Показываем ангелочка, если есть
                if (angelButton) {
                    angelButton.style.display = 'flex';
                    angelButton.innerHTML = '👼';
                    angelButton.classList.add('angel-icon');
                }
                
                // Добавляем класс is-killed для CSS-стилей
                localVideo.classList.add('is-killed');
                
                // Меняем цвет кнопки закрытия на белый, если пользователь "убит"
                if (closeSidebarBtn) {
                    closeSidebarBtn.classList.add('white');
                }
            } else {
                // Удаляем маркер, если он есть
                if (killMark) {
                    killMark.remove();
                }
                
                // Устанавливаем череп и делаем видимым
                if (angelButton) {
                    angelButton.style.display = 'flex';
                    angelButton.innerHTML = '💀';
                    angelButton.classList.remove('angel-icon');
                }
                
                // Удаляем класс is-killed
                localVideo.classList.remove('is-killed');
                
                // Возвращаем исходный цвет кнопки закрытия
                if (closeSidebarBtn) {
                    closeSidebarBtn.classList.remove('white');
                }
            }
        }
    }
    
    // Обновить отображение статуса "вбито" для удаленного пира
    function updatePeerKilledStatus(peerId) {
        const videoElement = document.getElementById(`remote-${peerId}`);
        const peer = peers.get(peerId);
        
        if (videoElement && peer) {
            if (peer.killed) {
                // Для удаленных пиров просто добавляем класс killed, 
                // но не добавляем текст "ВБИТО" - он добавляется через CSS
                videoElement.classList.add('killed');
                // Также добавляем класс is-killed для CSS-стилей кнопок
                videoElement.classList.add('is-killed');
            } else {
                videoElement.classList.remove('killed');
                videoElement.classList.remove('is-killed');
            }
            
            // Обновляем значок у кнопки (череп/ангел) в зависимости от статуса
            const killButton = videoElement.querySelector('.remote-kill-button');
            if (killButton) {
                killButton.innerHTML = peer.killed ? '👼' : '💀';
                // Для ведущего не добавляем angel-icon класс, чтобы кнопка оставалась кликабельной
                // Для обычных пользователей добавляем класс, чтобы сделать иконку некликабельной
                if (userRole !== 'host') {
                    if (peer.killed) {
                        killButton.classList.add('angel-icon');
                    } else {
                        killButton.classList.remove('angel-icon');
                    }
                }
            }
        }
    }
    
    // Функция для переключения статуса "вбито"
    function toggleKilledStatus() {
        // Инвертируем текущий статус
        isKilled = !isKilled;
        
        // Отправляем новый статус на сервер
        sendMessage({
            type: 'killed',
            killed: isKilled
        });
        
        // Обновляем отображение локально (хотя это также сделает confirmKilled)
        updateLocalKilledStatus();
    }
    
    // Обновить отображение имени для локального видео
    function updateLocalLabel() {
        console.log(`DEBUG updateLocalLabel: userRole=${userRole}, username=${username}`);
        if (localVideo) {
            const label = localVideo.querySelector('.video-label');
            if (label) {
                // Добавляем порядковый номер перед именем только для игроков (не ведущего)
                // и метку ведущего в конце для ведущего
                let displayName = '';
                
                // Для роли ведущего не добавляем номер, только (ведучий) после имени
                if (userRole === 'host') {
                    displayName = `You (${username}) (ведучий)`;
                    console.log(`DEBUG: Setting label for HOST: ${displayName}`);
                    
                    // Для ведущего убираем возможность клика на номер
                    label.classList.remove('clickable-order-index');
                } else {
                    // Для игрока добавляем порядковый номер перед именем и делаем его кликабельным
                    const orderPrefix = userOrderIndex ? `${userOrderIndex}. ` : '';
                    displayName = `${orderPrefix}You (${username})`;
                    console.log(`DEBUG: Setting label for PLAYER: ${displayName}`);
                    
                    // Для игрока оставляем класс, но удаляем обработчик клика для изменения номера
                    label.classList.add('clickable-order-index');
                    
                    // Удаляем обработчик клика для изменения номера
                    if (label.hasAttribute('order-index-click-handler')) {
                        label.removeAttribute('order-index-click-handler');
                    }
                }
                
                label.textContent = displayName;
                console.log(`DEBUG: Final label content: "${label.textContent}"`);
            } else {
                console.error("DEBUG: Could not find .video-label element in localVideo");
            }
            
            // Убираем класс host для видео, т.к. теперь показываем роль в подписи имени
            localVideo.classList.remove('host');
        } else {
            console.error("DEBUG: localVideo element not found");
        }
    }
    
    // Обновить отображение имени для удаленного пира
    function updatePeerLabel(peerId) {
        console.log(`Обновление метки для участника ${peerId}`);
        const videoElement = document.getElementById(`remote-${peerId}`);
        if (!videoElement) {
            console.log(`Не найден видео элемент для ${peerId}, отмена обновления метки`);
            return;
        }
        
        const label = videoElement.querySelector('.video-label');
        if (!label) {
            console.log(`Не найдена метка для видео ${peerId}, отмена обновления метки`);
            return;
        }
        
        // Если есть локальное имя, используем его, иначе используем имя из списка пиров
        const localName = localPeerNames.get(peerId);
        const peer = peers.get(peerId);
        
        if (!peer) {
            label.textContent = 'Participant';
            return;
        }
        
        let displayName = '';
        
        // Для ведущего не добавляем порядковый номер, только (ведущий)
        if (peer.role === 'host' || peer.isHost) {
            if (localName) {
                // Если есть локальное имя, используем его
                displayName = `${localName} (ведучий)`;
            } else {
                displayName = `${peer.username} (ведучий)`;
            }
            
            // Для ведущего убираем возможность клика на номер
            label.classList.remove('clickable-order-index');
        } else {
            // Для игроков добавляем порядковый номер перед именем
            const orderPrefix = peer.orderIndex ? `${peer.orderIndex}. ` : '';
            
            if (localName) {
                displayName = `${orderPrefix}${localName}`;
            } else {
                displayName = `${orderPrefix}${peer.username}`;
            }
            
            // Убираем обработчики кликов на индексе и классы кликабельности
            if (label.hasAttribute('order-index-click-handler')) {
                label.removeAttribute('order-index-click-handler');
            }
            
            // Для всех участников убираем класс кликабельности для индекса
            label.classList.remove('clickable-order-index');
        }
        
        label.textContent = displayName;
        
        // Убираем класс host для видео, т.к. теперь показываем роль в подписи имени
        videoElement.classList.remove('host');
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
            
            // Добавляем порядковый номер в отображаемое имя в списке
            let displayName = '';
            if (peer.role === 'host') {
                displayName = peer.username + ' (ведучий)';
            } else {
                displayName = (peer.orderIndex ? peer.orderIndex + '. ' : '') + peer.username;
            }
            
            if (localName) {
                option.textContent = `${displayName} (renamed to: ${localName})`;
            } else {
                option.textContent = displayName;
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
                            console.log(`Remote description set for ${peerId} after rollback`);
                            
                            // Проверяем, есть ли буфер ICE кандидатов для этого соединения
                            if (pc.iceCandidatesBuffer && pc.iceCandidatesBuffer.length > 0) {
                                console.log(`Adding ${pc.iceCandidatesBuffer.length} buffered ICE candidates for ${peerId} after rollback`);
                                
                                // Добавляем все буферизованные ICE кандидаты
                                const addCandidatePromises = pc.iceCandidatesBuffer.map(candidate => 
                                    pc.addIceCandidate(candidate)
                                      .catch(e => console.error(`Error adding buffered ICE candidate after rollback: ${e}`))
                                );
                                
                                // Очищаем буфер после добавления
                                Promise.all(addCandidatePromises)
                                    .then(() => {
                                        console.log(`Successfully added all buffered ICE candidates for ${peerId} after rollback`);
                                        pc.iceCandidatesBuffer = [];
                                    })
                                    .catch(error => {
                                        console.error(`Error adding buffered ICE candidates for ${peerId} after rollback:`, error);
                                    });
                            }
                            
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
                        
                        // Проверяем, есть ли буфер ICE кандидатов для этого соединения
                        if (pc.iceCandidatesBuffer && pc.iceCandidatesBuffer.length > 0) {
                            console.log(`Adding ${pc.iceCandidatesBuffer.length} buffered ICE candidates for ${peerId}`);
                            
                            // Добавляем все буферизованные ICE кандидаты
                            const addCandidatePromises = pc.iceCandidatesBuffer.map(candidate => 
                                pc.addIceCandidate(candidate)
                                  .catch(e => console.error(`Error adding buffered ICE candidate: ${e}`))
                            );
                            
                            // Очищаем буфер после добавления
                            Promise.all(addCandidatePromises)
                                .then(() => {
                                    console.log(`Successfully added all buffered ICE candidates for ${peerId}`);
                                    pc.iceCandidatesBuffer = [];
                                })
                                .catch(error => {
                                    console.error(`Error adding buffered ICE candidates for ${peerId}:`, error);
                                });
                        }
                        
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
                        
                        // Проверяем, есть ли буфер ICE кандидатов для этого соединения
                        if (pc.iceCandidatesBuffer && pc.iceCandidatesBuffer.length > 0) {
                            console.log(`Adding ${pc.iceCandidatesBuffer.length} buffered ICE candidates for ${peerId}`);
                            
                            // Добавляем все буферизованные ICE кандидаты
                            const addCandidatePromises = pc.iceCandidatesBuffer.map(candidate => 
                                pc.addIceCandidate(candidate)
                                  .catch(e => console.error(`Error adding buffered ICE candidate: ${e}`))
                            );
                            
                            // Очищаем буфер после добавления
                            Promise.all(addCandidatePromises)
                                .then(() => {
                                    console.log(`Successfully added all buffered ICE candidates for ${peerId}`);
                                    pc.iceCandidatesBuffer = [];
                                })
                                .catch(error => {
                                    console.error(`Error adding buffered ICE candidates for ${peerId}:`, error);
                                });
                        }
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
            let isHost = peer && (peer.role === 'host' || peer.isHost);
            
            // Для ведущего не добавляем порядковый номер, только (ведущий)
            if (isHost) {
                if (localName) {
                    // Если есть локальное имя, используем его
                    displayName = localName + ' (ведучий)';
                } else if (peer && peer.username) {
                    displayName = peer.username + ' (ведучий)';
                }
            } else {
                // Для игроков добавляем порядковый номер перед именем
                const orderPrefix = peer && peer.orderIndex ? `${peer.orderIndex}. ` : '';
                
                if (localName) {
                    // Если есть локальное имя, используем его
                    displayName = orderPrefix + localName;
                } else if (peer && peer.username) {
                    displayName = orderPrefix + peer.username;
                }
            }
            
            // Настраиваем drag-n-drop свойства в зависимости от роли
            const canBeDragged = !isHost && userRole === 'host';
            
            console.log(`DEBUG: Creating remote video for peer ${peerId}, isHost=${isHost}, displayName="${displayName}"`);
            
            // Create new video container
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.id = `remote-${peerId}`;
            videoItem.dataset.peerId = peerId;
            
            // Добавляем возможность перетаскивания для игроков, если текущий пользователь ведущий
            if (canBeDragged) {
                videoItem.classList.add('can-drag');
                videoItem.setAttribute('draggable', 'true');
            }
            
            // Если пир имеет статус "убит", добавить соответствующий класс
            if (peer && peer.killed) {
                videoItem.classList.add('killed');
            }
            
            // Не добавляем класс host, так как роль отображается в имени
            
            // Добавляем кнопку убито для игроков (не для ведущих):
            // - ведущий видит кнопку-череп (кликабельная) или ангелочка (некликабельная)
            // - обычные игроки видят только ангелочка для убитых (и ничего для живых)
            const isKilled = peer && peer.killed;
            const angelClass = isKilled ? ' angel-icon' : '';
            
            let killButtonHtml = '';
            if (!isHost) {
                if (userRole === 'host') {
                    // Для ведущего - кнопка всегда видна и кликабельна (даже ангелочек)
                    // НЕ добавляем класс angel-icon, чтобы кнопка оставалась кликабельной
                    killButtonHtml = `<button class="kill-button remote-kill-button" data-peer-id="${peerId}" title="Вбито">${isKilled ? '👼' : '💀'}</button>`;
                } else if (isKilled) {
                    // Для обычных игроков - показываем только ангелочка для убитых
                    killButtonHtml = `<button class="kill-button angel-icon" title="Вбито">👼</button>`;
                }
                // Для живых участников игроки не видят никаких иконок, только ведущий видит черепа
            }
                
            // Для удаленных участников "ВБИТО" добавляется через CSS оформление,
            // не добавляем отдельный элемент с надписью - это только для локального видео
            const killMarkHtml = '';
            
            videoItem.innerHTML = `
                <video autoplay playsinline></video>
                <div class="video-label">${displayName}</div>
                ${killButtonHtml}
                ${killMarkHtml}
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
            
            // Обработчики кнопки эмодзи ладони удалены для удаленных видео
            
            // Удаляем контекстное меню для видео элементов
            
            // Добавляем в контейнер и сортируем видео по порядковым номерам
            videoContainer.appendChild(videoItem);
            sortVideoElements();
            
            // Play the video with proper error handling
            const playPromise = videoElement.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log(`Successfully playing video from peer ${peerId}`);
                    })
                    .catch(error => {
                        console.error(`Error playing video from peer ${peerId}:`, error);
                        // Try to play again after a delay only if the video element still exists in DOM
                        setTimeout(() => {
                            const videoStillExists = document.getElementById(`remote-${peerId}`);
                            if (videoStillExists && document.body.contains(videoStillExists)) {
                                videoElement.play()
                                    .then(() => console.log(`Retry successful for peer ${peerId}`))
                                    .catch(e => console.error(`Retry failed for peer ${peerId}:`, e));
                            } else {
                                console.log(`Not retrying play for ${peerId} - element no longer in DOM`);
                            }
                        }, 1000);
                    });
            }
        } catch (error) {
            console.error(`Exception in createRemoteVideoElement for peer ${peerId}:`, error);
        }
    }
    
    // Скрыть контекстное меню
    // Сортировка видео элементов и создание сетки из 12 слотов
    function sortVideoElements() {
        console.log('Sorting video elements by slot index');
        
        // Сохраняем текущие видео элементы
        const currentVideoItems = Array.from(videoContainer.querySelectorAll('.video-item'));
        
        // Очищаем контейнер
        videoContainer.innerHTML = '';
        
        // Создаем фиксированную сетку из 12 слотов (4x3)
        for (let i = 1; i <= 12; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'empty-slot';
            slotElement.dataset.slotIndex = i;
            slotElement.innerHTML = `<span>Слот ${i}</span>`;
            
            // Добавляем обработчики событий для перетаскивания, если пользователь - ведущий
            if (userRole === 'host') {
                slotElement.addEventListener('dragover', handleDragOver);
                slotElement.addEventListener('dragleave', handleDragLeave);
                slotElement.addEventListener('drop', handleDrop);
            }
            
            videoContainer.appendChild(slotElement);
        }
        
        // Готовим массив всех видео элементов
        let allVideos = [];
        
        // Добавляем локальное видео если оно есть
        if (localVideo) {
            allVideos.push(localVideo);
        }
        
        // Добавляем все удаленные видео
        const remoteVideos = currentVideoItems.filter(item => item !== localVideo);
        allVideos = [...allVideos, ...remoteVideos];
        
        // Размещаем видео элементы в слотах согласно их orderIndex
        allVideos.forEach(videoItem => {
            const isLocal = videoItem === localVideo;
            const peerId = !isLocal ? videoItem.dataset.peerId : null;
            const peer = !isLocal ? peers.get(peerId) : null;
            const isHost = isLocal ? userRole === 'host' : (peer && (peer.role === 'host' || peer.isHost));
            
            let slotIndex;
            
            // Ведущий всегда должен быть в 12 слоте, независимо от других настроек
            if (isHost) {
                slotIndex = 12; // Ведущий всегда в последнем слоте
                
                // Принудительно устанавливаем слот 12 для локального видео, если пользователь - ведущий
                if (isLocal) {
                    localVideoSlotIndex = 12;
                    videoItem.dataset.slotIndex = "12";
                    console.log("Host forcing self to slot 12");
                }
            } else {
                // Для всех игроков, используем порядковый номер как номер слота
                // Это гарантирует, что игроки всегда будут находиться в слотах, соответствующих их номерам
                const orderIndex = isLocal ? userOrderIndex : (peer ? peer.orderIndex : 1);
                slotIndex = orderIndex;
                
                // Сохраняем назначенный слот
                if (isLocal) {
                    localVideoSlotIndex = slotIndex;
                    videoItem.dataset.slotIndex = slotIndex.toString();
                    console.log(`Локальный игрок установлен в слот ${slotIndex} согласно порядковому номеру ${orderIndex}`);
                } else if (peer) {
                    peer.slotIndex = slotIndex;
                    videoItem.dataset.slotIndex = slotIndex.toString();
                    console.log(`Игрок ${peerId} установлен в слот ${slotIndex} согласно порядковому номеру ${orderIndex}`);
                }
            }
            
            console.log(`Placing video ${isLocal ? 'local' : peerId} in slot ${slotIndex}`);
            
            // Находим слот с соответствующим индексом
            const targetSlot = videoContainer.querySelector(`.empty-slot[data-slot-index="${slotIndex}"]`);
            
            if (targetSlot) {
                // Заменяем пустой слот на видео элемент
                videoContainer.replaceChild(videoItem, targetSlot);
            } else {
                // Если слот для этого порядкового номера уже занят, пытаемся найти следующий доступный слот
                // или переназначаем слот, если пользователь явно указал позицию
                if (isLocal && localVideoSlotIndex !== null) {
                    slotIndex = localVideoSlotIndex;
                } else if (!isLocal && peer && peer.slotIndex !== undefined && peer.slotIndex !== null) {
                    slotIndex = peer.slotIndex;
                }

                // Ищем указанный слот или первый свободный
                const targetSlotByIndex = videoContainer.querySelector(`.empty-slot[data-slot-index="${slotIndex}"]`);
                if (targetSlotByIndex) {
                    videoContainer.replaceChild(videoItem, targetSlotByIndex);
                } else {
                    // Если нужного слота нет, находим первый свободный
                    const firstEmptySlot = videoContainer.querySelector('.empty-slot');
                    if (firstEmptySlot) {
                        videoContainer.replaceChild(videoItem, firstEmptySlot);
                        // Запоминаем назначенный слот
                        if (isLocal) {
                            localVideoSlotIndex = parseInt(firstEmptySlot.dataset.slotIndex);
                        } else if (peer) {
                            peer.slotIndex = parseInt(firstEmptySlot.dataset.slotIndex);
                        }
                    } else {
                        // Если свободных слотов нет (не должно происходить с 12 слотами)
                        console.warn('No empty slots available for video item');
                        videoContainer.appendChild(videoItem);
                    }
                }
            }
        });
        
        // Если текущий пользователь - ведущий, включаем возможность перетаскивания для всех игроков
        if (userRole === 'host') {
            enableDragAndDrop();
        }
        
        console.log('Video elements sorted and positions updated');
    }
    
    // Функция для включения drag-and-drop для видео элементов (только для ведущего)
    function enableDragAndDrop() {
        console.log('Enabling drag and drop for video elements');
        
        // Получаем все видео элементы
        const videoItems = Array.from(videoContainer.querySelectorAll('.video-item'));
        
        videoItems.forEach(item => {
            // Пропускаем элементы ведущих
            const isLocal = item === localVideo;
            const peerId = !isLocal ? item.dataset.peerId : null;
            const peer = !isLocal ? peers.get(peerId) : null;
            const isHost = isLocal ? userRole === 'host' : (peer && (peer.role === 'host' || peer.isHost));
            
            if (isHost) {
                // Для ведущих отключаем перетаскивание
                item.classList.remove('can-drag');
                item.setAttribute('draggable', 'false');
                
                // Удаляем обработчики если они были
                item.removeEventListener('dragstart', handleDragStart);
                item.removeEventListener('dragover', handleDragOver);
                item.removeEventListener('dragleave', handleDragLeave);
                item.removeEventListener('drop', handleDrop);
                item.removeEventListener('dragend', handleDragEnd);
                
                return;
            }
            
            // Для игроков включаем перетаскивание
            item.classList.add('can-drag');
            item.setAttribute('draggable', 'true');
            
            // Добавляем обработчики событий
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }
    
    // Обработчики событий drag-and-drop
    let draggedItem = null;
    
    function handleDragStart(e) {
        // Проверяем наличие hand-emoji-button и предотвращаем начало перетаскивания
        // если перетаскивание начато с нажатия на эту кнопку
        if (e.target.classList.contains('hand-emoji-button')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Сохраняем ссылку на элемент, который перетаскиваем
        draggedItem = this;
        this.classList.add('dragging');
        
        // Устанавливаем данные для переноса
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        
        // Для Firefox (требуется setData)
        if (e.dataTransfer.setDragImage) {
            e.dataTransfer.setDragImage(this, 0, 0);
        }
    }
    
    function handleDragOver(e) {
        e.preventDefault(); // Разрешаем drop
        this.classList.add('drag-over');
        return false;
    }
    
    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        
        // Убираем подсветку
        this.classList.remove('drag-over');
        
        // Если нет элемента, который перетаскиваем, выходим
        if (!draggedItem) return false;
        
        // Получаем инфо о перетаскиваемом элементе
        const isLocalDragged = draggedItem === localVideo;
        const peerIdDragged = !isLocalDragged ? draggedItem.dataset.peerId : null;
        
        // Получаем индекс слота назначения и исходный индекс слота с проверкой на валидность
        let targetSlotIndex;
        let sourceSlotIndex = parseInt(draggedItem.dataset.slotIndex, 10);
        
        // Проверка, что исходный слот - валидное число
        if (isNaN(sourceSlotIndex) || sourceSlotIndex <= 0) {
            // Если исходный слот невалидный, установим его на 1 по умолчанию
            sourceSlotIndex = 1;
            draggedItem.dataset.slotIndex = "1";
            console.log("Fixed invalid source slot index, set to 1");
        }
        
        // Для обмена порядковыми номерами
        let targetPeerId = null;
        
        // Проверяем, куда перетаскиваем - на пустой слот или на другой элемент
        if (this.classList.contains('empty-slot')) {
            // Перетаскивание на пустой слот
            targetSlotIndex = parseInt(this.dataset.slotIndex, 10);
            
            // Проверка, что целевой слот - валидное число
            if (isNaN(targetSlotIndex) || targetSlotIndex <= 0) {
                console.log("Invalid target slot in empty slot, aborting drag");
                return false;
            }
            
            console.log(`Перемещение с ${sourceSlotIndex} в пустой слот ${targetSlotIndex}`);
            
            // Обновляем DOM немедленно для лучшего пользовательского опыта
            if (isLocalDragged) {
                // Обновляем локальный видео элемент
                draggedItem.dataset.slotIndex = targetSlotIndex.toString();
                localVideoSlotIndex = targetSlotIndex;
            } else if (peerIdDragged) {
                // Обновляем удаленный видео элемент
                draggedItem.dataset.slotIndex = targetSlotIndex.toString();
                
                const peer = peers.get(peerIdDragged);
                if (peer) {
                    peer.slotIndex = targetSlotIndex;
                }
            }
            
            // Немедленно заменяем пустой слот на видео элемент
            // Находим родительский элемент пустого слота
            const parent = this.parentNode;
            if (parent) {
                // Проверяем, если перетаскиваемый элемент уже удален из DOM, не удаляем его снова
                try {
                    // Сначала вставляем перетаскиваемый элемент рядом с пустым слотом
                    parent.insertBefore(draggedItem, this);
                    // Затем удаляем пустой слот
                    parent.removeChild(this);
                    console.log(`Непосредственная замена пустого слота ${targetSlotIndex} на видео элемент`);
                } catch (error) {
                    console.warn('Ошибка DOM при замене пустого слота:', error);
                }
            }
            
            // Отправляем сообщение о новой позиции элемента всем участникам
            sendMessage({
                type: 'slot_position',
                peerId: isLocalDragged ? serverId : peerIdDragged,
                slotIndex: targetSlotIndex
            });
            
            // Меняем порядковый номер на соответствующий номеру слота
            if (isLocalDragged) {
                // Для локального пользователя меняем orderIndex на номер слота
                sendMessage({
                    type: 'change_order_index',
                    orderIndex: targetSlotIndex
                });
                
                // Обновляем значение локально
                userOrderIndex = targetSlotIndex;
                updateLocalLabel();
            } else if (peerIdDragged) {
                // Для удаленного пользователя меняем orderIndex на номер слота
                sendMessage({
                    type: 'change_order_index',
                    targetId: peerIdDragged,
                    orderIndex: targetSlotIndex
                });
                
                // Обновляем значение локально
                const peer = peers.get(peerIdDragged);
                if (peer) {
                    peer.orderIndex = targetSlotIndex;
                    // Немедленно обновляем метку участника с номером
                    updatePeerLabel(peerIdDragged);
                }
            }
        } else if (draggedItem !== this) {
            // Перетаскивание на другой элемент (не на себя)
            targetSlotIndex = parseInt(this.dataset.slotIndex, 10);
            targetPeerId = this.dataset.peerId;
            
            // Проверка, что целевой слот - валидное число
            if (isNaN(targetSlotIndex) || targetSlotIndex <= 0) {
                console.log("Invalid target slot in occupied slot, using source slot index");
                targetSlotIndex = sourceSlotIndex; // В случае ошибки используем исходный слот
                this.dataset.slotIndex = sourceSlotIndex.toString();
            }
            
            console.log(`Обмен между слотами: ${sourceSlotIndex} и ${targetSlotIndex}`);
            console.log(`Участники: ${isLocalDragged ? 'local' : peerIdDragged} и ${targetPeerId}`);

            // Обновляем сначала атрибуты data-slot-index на перетаскиваемом элементе и целевом элементе
            if (isLocalDragged) {
                localVideo.dataset.slotIndex = targetSlotIndex.toString();
                localVideoSlotIndex = targetSlotIndex;
            } else if (peerIdDragged) {
                draggedItem.dataset.slotIndex = targetSlotIndex.toString();
                
                const peer = peers.get(peerIdDragged);
                if (peer) {
                    peer.slotIndex = targetSlotIndex;
                }
            }
            
            // Затем обновляем целевой элемент
            this.dataset.slotIndex = sourceSlotIndex.toString();
            if (targetPeerId) {
                const targetPeer = peers.get(targetPeerId);
                if (targetPeer) {
                    targetPeer.slotIndex = sourceSlotIndex;
                }
            }
            
            // Выполняем обмен позициями DOM элементов
            // Убеждаемся, что оба элемента имеют одного родителя
            const parent = this.parentNode;
            if (parent && draggedItem.parentNode === parent) {
                try {
                    // Находим место перетаскиваемого элемента в DOM
                    const draggedSibling = draggedItem.nextSibling;
                    
                    // Если перетаскиваемый элемент находится прямо перед целевым, нужна специальная логика
                    if (draggedSibling === this) {
                        // Перемещаем целевой элемент перед перетаскиваемым
                        parent.insertBefore(this, draggedItem);
                    } else {
                        // Сохраняем, что находится после целевого элемента
                        const targetSibling = this.nextSibling;
                        
                        // Перемещаем целевой элемент на место перетаскиваемого
                        parent.insertBefore(this, draggedSibling);
                        
                        // Перемещаем перетаскиваемый элемент на место целевого
                        parent.insertBefore(draggedItem, targetSibling);
                    }
                    console.log(`Непосредственное перемещение DOM элементов между слотами ${sourceSlotIndex} и ${targetSlotIndex}`);
                } catch (error) {
                    console.warn('Ошибка DOM при обмене элементами:', error);
                }
            }
            
            // Обмен порядковыми номерами
            if (isLocalDragged) {
                // Обмен между локальным пользователем и удаленным пиром
                swapOrderIndices(null, targetPeerId);
            } else {
                // Обмен между двумя удаленными пирами
                swapOrderIndices(peerIdDragged, targetPeerId);
            }
            
            // Отправляем сообщения о позициях слотов после обмена
            sendMessage({
                type: 'slot_position',
                peerId: isLocalDragged ? serverId : peerIdDragged,
                slotIndex: targetSlotIndex
            });
            
            sendMessage({
                type: 'slot_position',
                peerId: targetPeerId,
                slotIndex: sourceSlotIndex
            });
        } else {
            // Перетаскивание на себя - ничего не делаем
            return false;
        }
        
        // Ждем небольшую задержку перед пересортировкой, чтобы дать время обновиться DOM
        setTimeout(() => {
            // Пересортировываем видео элементы
            sortVideoElements();
        }, 300);
        
        return false;
    }
    
    function handleDragEnd(e) {
        // Убираем состояние перетаскивания
        this.classList.remove('dragging');
        
        // Удаляем подсветку со всех элементов
        const videoItems = Array.from(videoContainer.querySelectorAll('.video-item'));
        videoItems.forEach(item => item.classList.remove('drag-over'));
        
        // Сбрасываем переменную
        draggedItem = null;
    }
    
    // Функция для обмена порядковыми номерами между двумя элементами
    function swapOrderIndices(peerIdA, peerIdB) {
        console.log(`Swapping order indices between ${peerIdA || 'local'} and ${peerIdB || 'local'}`);
        
        // Получаем текущие порядковые номера
        const orderA = peerIdA ? (peers.get(peerIdA)?.orderIndex || 0) : userOrderIndex;
        const orderB = peerIdB ? (peers.get(peerIdB)?.orderIndex || 0) : userOrderIndex;
        
        console.log(`Текущие порядковые номера: ${peerIdA || 'local'}=${orderA}, ${peerIdB || 'local'}=${orderB}`);
        
        // Меняем номера местами
        if (peerIdA) {
            const peerA = peers.get(peerIdA);
            if (peerA) {
                // Обновляем порядковый номер для Peer A
                peerA.orderIndex = orderB;
                console.log(`Установлен новый порядковый номер для ${peerIdA}: ${orderB}`);
                
                // Используем updatePeerLabel для обновления метки
                updatePeerLabel(peerIdA);
                console.log(`Вызвана updatePeerLabel для ${peerIdA} с новым номером ${orderB}`);
                
                // Отправляем изменение на сервер
                sendMessage({
                    type: 'change_order_index',
                    targetId: peerIdA,
                    orderIndex: orderB
                });
                
                // Также обновляем позицию слота, чтобы она соответствовала новому порядковому номеру
                setTimeout(() => {
                    sendMessage({
                        type: 'slot_position',
                        peerId: peerIdA,
                        slotIndex: orderB
                    });
                    console.log(`Обновлена позиция слота для ${peerIdA} на ${orderB}`);
                }, 200);
            }
        } else {
            // Для локального пользователя
            userOrderIndex = orderB;
            console.log(`Установлен новый порядковый номер для local: ${orderB}`);
            
            // Обновляем отображение порядкового номера
            updateLocalLabel();
            console.log(`Вызвана updateLocalLabel для локального игрока с новым номером ${orderB}`);
            
            // Отправляем изменение на сервер (свой порядковый номер)
            sendMessage({
                type: 'change_order_index',
                orderIndex: orderB
            });
            
            // Также обновляем позицию слота
            if (userRole === 'player') {
                setTimeout(() => {
                    // Обновляем позицию слота для себя
                    sendMessage({
                        type: 'slot_position',
                        slotIndex: orderB
                    });
                    console.log(`Обновлена позиция слота для local на ${orderB}`);
                }, 200);
            }
        }
        
        if (peerIdB) {
            const peerB = peers.get(peerIdB);
            if (peerB) {
                // Обновляем порядковый номер для Peer B
                peerB.orderIndex = orderA;
                console.log(`Установлен новый порядковый номер для ${peerIdB}: ${orderA}`);
                
                // Используем updatePeerLabel для обновления метки
                updatePeerLabel(peerIdB);
                console.log(`Вызвана updatePeerLabel для ${peerIdB} с новым номером ${orderA}`);
                
                // Отправляем изменение на сервер
                sendMessage({
                    type: 'change_order_index',
                    targetId: peerIdB,
                    orderIndex: orderA
                });
                
                // Также обновляем позицию слота, чтобы она соответствовала новому порядковому номеру
                setTimeout(() => {
                    sendMessage({
                        type: 'slot_position',
                        peerId: peerIdB,
                        slotIndex: orderA
                    });
                    console.log(`Обновлена позиция слота для ${peerIdB} на ${orderA}`);
                }, 300);
            }
        } else {
            // Для локального пользователя
            userOrderIndex = orderA;
            console.log(`Установлен новый порядковый номер для local: ${orderA}`);
            
            // Обновляем отображение порядкового номера
            updateLocalLabel();
            console.log(`Вызвана updateLocalLabel для локального игрока с новым номером ${orderA}`);
            
            // Отправляем изменение на сервер (свой порядковый номер)
            sendMessage({
                type: 'change_order_index',
                orderIndex: orderA
            });
            
            // Также обновляем позицию слота
            if (userRole === 'player') {
                setTimeout(() => {
                    // Обновляем позицию слота для себя
                    sendMessage({
                        type: 'slot_position',
                        slotIndex: orderA
                    });
                    console.log(`Обновлена позиция слота для local на ${orderA}`);
                }, 300);
            }
        }
        
        // Пересортировываем элементы
        setTimeout(() => {
            console.log(`Перестраиваем сортировку видео-элементов после обмена номерами`);
            sortVideoElements();
        }, 400);
    }
    
    // Контекстное меню отключено (функция сохранена для совместимости)
    function hideContextMenu() {
        // Ничего не делаем, так как контекстное меню отключено
    }

    // Remove a peer and clean up resources
    function removePeer(peerId) {
        console.log(`Removing peer ${peerId}`);
        const pc = peerConnections[peerId];
        if (pc) {
            pc.close();
            delete peerConnections[peerId];
            
            // Remove the video element
            const videoElement = document.getElementById(`remote-${peerId}`);
            if (videoElement) {
                // First stop video playback and remove srcObject to prevent AbortError
                const video = videoElement.querySelector('video');
                if (video) {
                    try {
                        // Pause the video first to prevent AbortError during removal
                        video.pause();
                        video.srcObject = null;
                    } catch (e) {
                        console.warn(`Error cleaning up video element for peer ${peerId}:`, e);
                    }
                }
                videoElement.remove();
            }
        }
        
        // Also remove from peers list
        if (peers.has(peerId)) {
            peers.delete(peerId);
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
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    // Toggle track enabled state
                    if (videoTrack.enabled) {
                        disableLocalCamera();
                    } else {
                        enableLocalCamera();
                    }
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
        sidebarToggleBtn.style.display = 'none'; // Скрываем кнопку после закрытия сайдбара
    }
    
    // Функция для показа кнопки сайдбара при наведении на левую часть экрана
    function setupSidebarHoverDetection() {
        // Создаем невидимую зону для определения наведения в левой трети экрана
        const hoverZone = document.createElement('div');
        hoverZone.style.position = 'fixed';
        hoverZone.style.top = '0';
        hoverZone.style.left = '0';
        hoverZone.style.width = '33%'; // Левая треть экрана
        hoverZone.style.height = '100%';
        hoverZone.style.zIndex = '1030'; // Ниже чем у кнопки, но выше большинства элементов
        hoverZone.style.pointerEvents = 'none'; // Не блокирует клики
        document.body.appendChild(hoverZone);
        
        // Показываем кнопку при наведении на левую треть экрана
        document.addEventListener('mousemove', (e) => {
            const screenWidth = window.innerWidth;
            const mouseX = e.clientX;
            
            // Если мышь в левой трети экрана и сайдбар не открыт
            if (mouseX < screenWidth / 3 && !controlSidebar.classList.contains('show')) {
                sidebarToggleBtn.style.display = 'flex';
            } else if (mouseX >= screenWidth / 3 && !controlSidebar.classList.contains('show')) {
                sidebarToggleBtn.style.display = 'none';
            }
        });
    }
    
    function initSidebarSettings() {
        // Определить текущее качество видео и заполнить форму
        const videoTrack = localStream && localStream.getVideoTracks()[0];
        if (videoTrack) {
            const settings = videoTrack.getSettings();
            
            // Определить, какой пресет выбрать
            let preset = 'hd'; // По умолчанию HD (720p)
            if (settings.width) {
                if (settings.width >= 1920) preset = 'fullhd'; // 1080p
                else preset = 'hd'; // 720p
            }
            
            // Установить значения в форме
            if (sidebarVideoQualitySelect) sidebarVideoQualitySelect.value = preset;
            if (sidebarCustomVideoSettings) sidebarCustomVideoSettings.style.display = 'none';
            
            // Установить видимые размеры
            if (sidebarVideoWidthInput) sidebarVideoWidthInput.value = settings.width || videoQualityPresets[preset].width;
            if (sidebarVideoHeightInput) sidebarVideoHeightInput.value = settings.height || videoQualityPresets[preset].height;
            
            // Установить битрейт
            const bitrate = window.customBitrate || videoQualityPresets[preset].bitrate;
            
            // Битрейт всегда автоматически подстраивается, убираем возможность ручной настройки
            window.autoAdjustBitrate = true;
            
            // Отображаем текущий битрейт в сайдбаре (неизменяемый)
            const bitrateSettingsContainer = document.getElementById('bitrate-settings-container');
            if (bitrateSettingsContainer) {
                bitrateSettingsContainer.style.display = 'block';
            }
            
            // Отображаем текущий битрейт в поле вывода
            const currentBitrateDisplay = document.getElementById('current-bitrate-display');
            if (currentBitrateDisplay) {
                currentBitrateDisplay.value = window.customBitrate || bitrate;
            }
            
            // Показываем информацию о рекомендуемом битрейте
            const recommendedBitrateInfo = document.getElementById('recommended-bitrate-info');
            if (recommendedBitrateInfo) {
                recommendedBitrateInfo.textContent = 'Бітрейт налаштовується автоматично';
            }
            
            // Инициализация селектора качества для получаемого видео
            const remoteVideoQualitySelect = document.getElementById('remote-video-quality');
            if (remoteVideoQualitySelect) {
                remoteVideoQualitySelect.addEventListener('change', () => {
                    // Логируем выбранное качество
                    console.log(`Changed remote video quality to: ${remoteVideoQualitySelect.value}`);
                    window.appLogs.push({
                        timestamp: new Date().toISOString(),
                        message: `Changed remote video quality to: ${remoteVideoQualitySelect.value}`
                    });
                    
                    // Применяем новые настройки качества ко всем входящим видео потокам
                    // Закомментировано по запросу пользователя
                    // applyRemoteVideoQualitySettings(remoteVideoQualitySelect.value);
                });
            }
            
            // Обновить иконки
            feather.replace();
        }
    }
    
    // Function to apply remote video quality settings to all peer connections
    // Закомментировано по запросу пользователя
    function applyRemoteVideoQualitySettings(qualityLevel) {
        /* Функция временно отключена по запросу пользователя
        // Получаем все видео элементы кроме локального
        const remoteVideos = document.querySelectorAll('.video-item:not(.local-video) video');
        
        // Настройки разрешения для разных уровней качества
        let width, height;
        
        switch (qualityLevel) {
            case 'sd':
                width = 640;
                height = 480;
                break;
            case 'low':
                width = 480;
                height = 360;
                break;
            case 'lowest':
                width = 320;
                height = 240;
                break;
            case 'original':
            default:
                // Оригинальное качество - сбрасываем все ограничения
                remoteVideos.forEach(video => {
                    video.style.filter = 'none';
                    if (video.srcObject) {
                        console.log(`Resetting quality for video: ${video.parentElement.dataset.peerId || video.parentElement.id}`);
                    }
                });
                
                // Логируем действие
                console.log('Applied original quality to all remote videos');
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: 'Applied original quality to all remote videos'
                });
                
                return;
        }
        */
        
        // Просто возвращаем, ничего не делая
        console.log('Remote video quality settings function is currently disabled');
        return;
        
        /* Код отключен по запросу пользователя
        // Применяем ограничения к каждому видео элементу
        remoteVideos.forEach(video => {
            if (video.srcObject) {
                const peerId = video.parentElement.dataset.peerId || video.parentElement.id;
                
                // Добавляем CSS filter для визуального обозначения пониженного качества
                if (qualityLevel === 'low') {
                    video.style.filter = 'brightness(0.95)';
                } else if (qualityLevel === 'lowest') {
                    video.style.filter = 'brightness(0.9)';
                } else {
                    video.style.filter = 'none';
                }
                
                console.log(`Applied ${qualityLevel} quality (${width}x${height}) to remote video: ${peerId}`);
                
                // Устанавливаем ограничения размера
                video.style.objectFit = 'contain';
                
                // Логируем действие для каждого видео
                console.log(`Applied ${qualityLevel} quality (${width}x${height}) to remote video: ${peerId}`);
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `Applied ${qualityLevel} quality (${width}x${height}) to remote video: ${peerId}`
                });
            }
        });
        
        // Логируем общее действие
        console.log(`Applied ${qualityLevel} quality (${width}x${height}) to all remote videos`);
        window.appLogs.push({
            timestamp: new Date().toISOString(),
            message: `Applied ${qualityLevel} quality (${width}x${height}) to all remote videos`
        });
        */
    }
    
    // Обработчики для сайдбара
    if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', showControlSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', hideControlSidebar);
    
    // Добавляем обработчики для кнопок в сайдбаре
    const sidebarLeaveBtn = document.getElementById('sidebar-leave-btn');
    if (sidebarLeaveBtn) {
        sidebarLeaveBtn.addEventListener('click', disconnect);
    }
    
    // Обработчик для кнопки включения/выключения видео в сайдбаре
    if (sidebarToggleVideoBtn) {
        sidebarToggleVideoBtn.addEventListener('click', async () => {
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    // Toggle track enabled state
                    if (videoTrack.enabled) {
                        disableLocalCamera();
                    } else {
                        enableLocalCamera();
                    }
                }
            }
        });
    }
    
    // Добавляем обработчики для кнопок управления камерой в сайдбаре
    const sidebarEnableCameraBtn = document.getElementById('sidebar-enable-camera-btn');
    const sidebarDisableCameraBtn = document.getElementById('sidebar-disable-camera-btn');
    
    if (sidebarEnableCameraBtn) {
        sidebarEnableCameraBtn.addEventListener('click', () => {
            enableLocalCamera();
            console.log('Camera enabled from sidebar');
        });
    }
    
    if (sidebarDisableCameraBtn) {
        sidebarDisableCameraBtn.addEventListener('click', () => {
            disableLocalCamera();
            console.log('Camera disabled from sidebar');
        });
    }
    
    // Обработчик для кнопки "Оживити всіх"
    if (reviveAllBtn) {
        reviveAllBtn.addEventListener('click', () => {
            if (userRole !== 'host') {
                showError('Только ведущий может снять статус "вбито" со всех участников');
                return;
            }
            
            console.log('Host is reviving all participants');
            
            // Отправляем запрос на сервер для снятия статуса "вбито" со всех участников
            sendMessage({
                type: 'revive_all'
            });
        });
    }
    
    // Переменная для хранения идентификатора активного таймера
    let activeTimerId = null;
    
    // Функция для запуска и отображения таймера с анимацией
    function startTimer(durationInSeconds, showAnimation = true) {
        const balaganAnnouncement = document.getElementById('balagan-announcement');
        const stopBalaganAnnouncement = document.getElementById('stop-balagan-announcement');
        
        console.log(`Запуск таймера на ${durationInSeconds} секунд, с анимацией: ${showAnimation}`);
        
        // Если есть активный таймер, останавливаем его
        if (currentTimerInterval) {
            console.log("Остановка предыдущего таймера");
            clearInterval(currentTimerInterval);
            currentTimerInterval = null;
        }
        
        // Очищаем все предыдущие таймауты
        if (activeTimerId) {
            console.log("Очистка предыдущего активного таймера ID:", activeTimerId);
            clearTimeout(activeTimerId);
            activeTimerId = null;
        }
        
        // Сразу скрываем все анимации
        balaganAnnouncement.style.display = 'none';
        balaganAnnouncement.style.animation = '';
        stopBalaganAnnouncement.style.display = 'none';
        stopBalaganAnnouncement.style.animation = '';
        
        // Устанавливаем начальное значение таймера
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        if (showAnimation) {
            // Просто показываем анимацию "Балаган" без перемещения
            balaganAnnouncement.style.display = 'block';
            balaganAnnouncement.style.opacity = '1';
            
            // Через 1.5 секунды скрываем анимацию и показываем таймер
            activeTimerId = setTimeout(() => {
                // Скрываем анимацию "Балаган"
                balaganAnnouncement.style.display = 'none';
                
                // Показываем таймер
                timerContainer.style.display = 'flex';
                timerDisplay.style.opacity = '1';
                
                // Запускаем обратный отсчет
                startTimerCountdown(durationInSeconds);
            }, 1500);
        } else {
            // Если без анимации, просто показываем таймер и запускаем отсчет
            timerContainer.style.display = 'flex';
            timerDisplay.style.opacity = '1';
            startTimerCountdown(durationInSeconds);
        }
        
        // Функция для запуска обратного отсчета таймера
        function startTimerCountdown(duration) {
            console.log(`Запуск обратного отсчета на ${duration} секунд`);
            
            // Используем точное время для более точного отсчета
            const startTime = Date.now();
            const endTime = startTime + (duration * 1000);
            
            // Обновляем таймер каждую секунду
            currentTimerInterval = setInterval(() => {
                // Вычисляем оставшееся время
                const currentTime = Date.now();
                const remainingTime = Math.max(0, endTime - currentTime);
                
                if (remainingTime <= 0) {
                    // Таймер закончился
                    console.log("Таймер завершился");
                    clearInterval(currentTimerInterval);
                    currentTimerInterval = null;
                    timerContainer.style.display = 'none';
                    
                    // Показываем уведомление "Чічічі Стоп Балаган"
                    stopBalaganAnnouncement.style.display = 'block';
                    stopBalaganAnnouncement.style.animation = 'stopBalaganAppear 0.5s forwards';
                    
                    // Через 1.5 секунды скрываем сообщение
                    activeTimerId = setTimeout(() => {
                        stopBalaganAnnouncement.style.animation = 'stopBalaganDisappear 0.5s forwards';
                        
                        // После завершения анимации полностью убираем элемент
                        activeTimerId = setTimeout(() => {
                            stopBalaganAnnouncement.style.display = 'none';
                            stopBalaganAnnouncement.style.animation = '';
                            activeTimerId = null;
                        }, 500);
                    }, 1500);
                    return;
                }
                    
                // Преобразуем миллисекунды в минуты и секунды
                const minutes = Math.floor(remainingTime / 60000);
                const seconds = Math.floor((remainingTime % 60000) / 1000);
                
                // Отображаем время в формате MM:SS с ведущими нулями
                timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }, 500);  // Более частое обновление для плавности
        }
    }
    
    // Обработчик клика на кнопку "Балаган" (1 минута)
    if (balaganBtn) {
        balaganBtn.addEventListener('click', () => {
            if (userRole !== 'host') {
                showError('Тільки ведучий може використовувати кнопку "Балаган"');
                return;
            }
            
            console.log('Host is starting a 1-minute timer (Балаган)');
            
            // Отправляем сообщение о начале "Балагана" всем участникам
            sendMessage({
                type: 'balagan',
                duration: 60 // 1 минута в секундах
            });
            
            // Локально запускаем таймер для немедленной обратной связи
            startTimer(60);
        });
    }
    
    // Обработчик клика на кнопку "Таймер" (60 секунд)
    if (timer60SecBtn) {
        timer60SecBtn.addEventListener('click', () => {
            if (userRole !== 'host') {
                showError('Тільки ведучий може використовувати кнопку таймера');
                return;
            }
            
            console.log('Host is starting a 60-second timer');
            
            // Отправляем сообщение о запуске таймера всем участникам
            sendMessage({
                type: 'balagan',
                duration: 60, // 60 секунд
                showAnimation: false // Без анимации "Балаган"
            });
            
            // Локально запускаем таймер без анимации
            startTimer(60, false);
        });
    }
    
    // Обработчик клика на кнопку "Таймер" (30 секунд)
    if (timer30SecBtn) {
        timer30SecBtn.addEventListener('click', () => {
            if (userRole !== 'host') {
                showError('Тільки ведучий може використовувати кнопку таймера');
                return;
            }
            
            console.log('Host is starting a 30-second timer');
            
            // Отправляем сообщение о запуске таймера всем участникам
            sendMessage({
                type: 'balagan',
                duration: 30, // 30 секунд
                showAnimation: false // Без анимации "Балаган"
            });
            
            // Локально запускаем таймер без анимации
            startTimer(30, false);
        });
    }
    
    // Обработчик для кнопки присвоения номеров игрокам в соответствии с их слотами
    if (randomizePlayerOrderBtn) {
        randomizePlayerOrderBtn.addEventListener('click', () => {
            console.log('Started slot-based order index assignment');
            
            // Находим все элементы видео для определения слотов
            const videoItems = Array.from(videoContainer.querySelectorAll('.video-item'));
            const slotAssignments = new Map(); // peerId -> slotIndex
            
            // Создаем карту назначений слотов на основе текущих позиций видео элементов
            videoItems.forEach(item => {
                const peerId = item.dataset.peerId;
                const isLocal = item === localVideo;
                const slotIndex = parseInt(item.dataset.slotIndex, 10);
                
                // Проверяем валидность слота
                if (!isNaN(slotIndex) && slotIndex > 0) {
                    if (isLocal) {
                        // Для локального пользователя сохраняем особый ключ
                        slotAssignments.set('local', slotIndex);
                    } else if (peerId) {
                        // Для удаленных пиров сохраняем по ID
                        slotAssignments.set(peerId, slotIndex);
                    }
                    console.log(`Found valid slot assignment: ${isLocal ? 'local' : peerId} in slot ${slotIndex}`);
                } else {
                    console.log(`Invalid slot found for ${isLocal ? 'local' : peerId}, will be ignored`);
                }
            });
            
            // Собираем информацию о текущих занятых слотах
            // Сначала получаем всех игроков (не ведущих)
            const players = Array.from(peers.entries())
                .filter(([_, peer]) => peer.role !== 'host' && !peer.isHost);

            console.log(`Found ${players.length} players for randomization`);
            
            // Если у нас меньше 2 игроков, рандомизация не имеет смысла
            if (players.length < 2) {
                console.log('Not enough players for randomization (need at least 2)');
                return;
            }
            
            // Собираем текущие занятые слоты для каждого игрока
            const currentPositions = players.map(([id, peer]) => ({
                peerId: id,
                slotIndex: peer.slotIndex || 0
            })).filter(pos => pos.slotIndex > 0);
            
            console.log('Current player positions:', currentPositions);
            
            // Создаем массив слотов для перемешивания (используем только те слоты, которые уже заняты)
            const takenSlots = currentPositions.map(pos => pos.slotIndex);
            console.log('Currently taken slots:', takenSlots);
            
            // Перемешиваем только занятые слоты
            const shuffledSlots = [...takenSlots];
            for (let i = shuffledSlots.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledSlots[i], shuffledSlots[j]] = [shuffledSlots[j], shuffledSlots[i]];
            }
            
            console.log('Shuffled slots:', shuffledSlots);
            
            // Создаем список новых назначений
            const assignments = [];
            
            // Присваиваем каждому игроку новый перемешанный слот
            players.forEach(([id, peer], index) => {
                // Ищем текущую позицию игрока
                const currentPosIndex = currentPositions.findIndex(pos => pos.peerId === id);
                
                // Если у этого игрока есть текущая позиция
                if (currentPosIndex >= 0) {
                    // Берем следующий перемешанный слот (учитывая индекс в массиве currentPositions)
                    const newSlotIndex = shuffledSlots[currentPosIndex];
                    
                    assignments.push({
                        peerId: id,
                        oldSlotIndex: peer.slotIndex,
                        newSlotIndex: newSlotIndex
                    });
                    
                    console.log(`Player ${id} will move from slot ${peer.slotIndex} to slot ${newSlotIndex}`);
                }
            });
            
            // Отправляем назначения последовательно с задержками
            assignments.forEach((assignment, index) => {
                setTimeout(() => {
                    const { peerId, oldSlotIndex, newSlotIndex } = assignment;
                    const peer = peers.get(peerId);
                    
                    if (peer) {
                        console.log(`Moving player ${peerId} from slot ${oldSlotIndex} to slot ${newSlotIndex}`);
                        
                        // Обновляем слот и порядковый номер в объекте пира
                        peer.slotIndex = newSlotIndex;
                        peer.orderIndex = newSlotIndex;
                        
                        // Обновляем DOM элемент напрямую
                        const videoElement = document.getElementById(`remote-${peerId}`);
                        if (videoElement) {
                            videoElement.dataset.slotIndex = newSlotIndex.toString();
                            console.log(`Updated DOM element for player ${peerId} to slot ${newSlotIndex}`);
                        }
                        
                        // Сначала обновляем порядковый номер (меняем значение отображаемого номера)
                        sendMessage({
                            type: 'change_order_index',
                            targetId: peerId,
                            orderIndex: newSlotIndex
                        });
                        
                        // Затем с задержкой отправляем информацию о новой позиции слота (перемещаем видео)
                        setTimeout(() => {
                            sendMessage({
                                type: 'slot_position',
                                peerId: peerId,
                                slotIndex: newSlotIndex
                            });
                            
                            // Обновляем метку с именем участника
                            updatePeerLabel(peerId);
                        }, 200);
                    }
                }, index * 500); // Значительная задержка между операциями (500мс)
            });
            
            // Сортируем элементы после всех изменений с очень большой задержкой
            // Используем задержку, учитывающую количество операций и время обмена
            const totalDelayMs = assignments.length * 1000;
            setTimeout(() => {
                console.log('All slot-based order indices assigned, sorting video elements');
                sortVideoElements();
                
                // Дополнительная защита - еще раз пересортируем через секунду
                setTimeout(() => {
                    console.log('Performing final sort after all operations');
                    sortVideoElements();
                }, 1000);
            }, totalDelayMs);
        });
    }
    
    // Добавляем обработчик для кнопок "Вбито" у удаленных участников
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remote-kill-button')) {
            e.preventDefault();
            const peerId = e.target.dataset.peerId;
            
            // Проверяем, что текущий пользователь — ведущий
            // Теперь разрешаем нажимать и на ангелочка (для оживления игрока)
            if (peerId && userRole === 'host') {
                // Получаем пира из списка
                const peer = peers.get(peerId);
                if (peer) {
                    // Инвертируем статус убит/не убит
                    const newKilledStatus = !peer.killed;
                    
                    // Отправляем новый статус на сервер
                    sendMessage({
                        type: 'kill_peer',  // новый тип сообщения для сервера
                        targetId: peerId,
                        killed: newKilledStatus
                    });
                    
                    console.log(`Toggling killed status for peer ${peerId} to ${newKilledStatus}`);
                    
                    // Обновляем локально (хотя сервер должен прислать подтверждение)
                    peer.killed = newKilledStatus;
                    updatePeerKilledStatus(peerId);
                }
            }
        }
    });

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
            let bitrate = 0;
            
            // Видео уже включено автоматически при подключении
            videoEnabled = true;
            
            let requestedWidth, requestedHeight;
            
            if (selectedQuality === 'custom') {
                requestedWidth = parseInt(sidebarVideoWidthInput.value, 10);
                requestedHeight = parseInt(sidebarVideoHeightInput.value, 10);
                bitrate = parseInt(sidebarVideoBitrateInput.value, 10);
            } else {
                const preset = videoQualityPresets[selectedQuality];
                requestedWidth = preset.width;
                requestedHeight = preset.height;
                bitrate = preset.bitrate;
            }
            
            // Сначала попробуем применить точные ограничения для запрошенного разрешения
            console.log(`Applying exact resolution constraints ${requestedWidth}x${requestedHeight}`);
            
            // Создаем точные ограничения для видео
            let videoConstraints = {
                width: { exact: requestedWidth },
                height: { exact: requestedHeight },
                facingMode: 'user'
            };
            
            // Добавим выбор устройства, если оно указано
            if (selectedCameraId) {
                // Используем "exact" для deviceId для максимальной точности соответствия
                videoConstraints.deviceId = { exact: selectedCameraId };
                console.log('Using exact deviceId constraint for maximum precision');
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: 'Using exact deviceId constraint for maximum precision'
                });
            }
            
            // Если точные ограничения не сработают, функция getValidVideoConstraints вернет более гибкие
            try {
                // Проверяем, работают ли точные ограничения
                const testStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false
                });
                
                // Если дошли сюда, значит точные ограничения работают
                testStream.getTracks().forEach(track => track.stop());
                
                console.log('Exact constraints worked successfully!');
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `Exact constraints worked successfully for ${requestedWidth}x${requestedHeight}`
                });
            } catch (error) {
                // Если точные ограничения не сработали, используем getValidVideoConstraints
                console.log(`Exact constraints failed, falling back to flexible: ${error.message}`);
                window.appLogs.push({
                    timestamp: new Date().toISOString(),
                    message: `Exact constraints failed: ${error.message}, using flexible constraints`
                });
                
                // Получаем валидные ограничения для запрошенного разрешения
                videoConstraints = await getValidVideoConstraints(requestedWidth, requestedHeight);
                
                // Добавляем deviceId снова, т.к. getValidVideoConstraints возвращает новый объект
                if (selectedCameraId) {
                    videoConstraints.deviceId = { exact: selectedCameraId };
                    console.log("Using exact deviceId constraint for maximum precision");
                }
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
                
                // Обновить селектор камеры, установив текущую камеру
                const videoTrack = newStream.getVideoTracks()[0];
                if (videoTrack && videoTrack.getSettings) {
                    const settings = videoTrack.getSettings();
                    
                    // Обновляем селектор качества видео на основе полученного разрешения
                    if (localVideoQualitySelect && settings.width && settings.height) {
                        console.log(`Обновляем селектор качества видео по фактическому разрешению: ${settings.width}x${settings.height}`);
                        
                        // Определяем, какой пресет соответствует полученному разрешению
                        let matchedQuality = 'sd'; // По умолчанию SD 480p
                        if (settings.width >= 1920 && settings.height >= 1080) {
                            matchedQuality = 'fullhd';
                        } else if (settings.width >= 1280 && settings.height >= 720) {
                            matchedQuality = 'hd';
                        }
                        
                        // Обновляем селектор качества видео
                        localVideoQualitySelect.value = matchedQuality;
                        console.log(`Установлено качество видео в селекторе: ${matchedQuality} на основании разрешения ${settings.width}x${settings.height}`);
                    }
                    
                    // Обновляем селектор камеры
                    if (cameraSelect && settings.deviceId) {
                        selectedCameraId = settings.deviceId;
                        console.log(`Updating camera select to match current camera: ${settings.deviceId}`);
                        // Если есть селектор камеры, обновляем выбранное значение
                        if (cameraSelect.querySelector(`option[value="${settings.deviceId}"]`)) {
                            cameraSelect.value = settings.deviceId;
                        }
                    }
                }
                
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
            const settings = peerVideoSettings.get(peerId) || videoQualityPresets.sd;
            
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
    
    // Отключаем контекстное меню для видео элементов
    document.addEventListener('contextmenu', (e) => {
        // Найти ближайший родительский элемент с классом video-item
        const videoItem = e.target.closest('.video-item');
        if (videoItem) {
            // Отменить стандартное контекстное меню для всех видео элементов
            e.preventDefault();
        }
    });
    
    // Функции для работы с перемещением и масштабированием видео удалены
    function createVideoControls(videoItem) {
        if (videoItem.querySelector('.video-controls')) return;
        
        const controls = document.createElement('div');
        controls.className = 'video-controls';
        
        // Получаем видео элемент и его peerId
        const videoElement = videoItem.querySelector('video');
        const peerId = videoItem.dataset.peerId;
        
        // Определяем, является ли это локальным видео
        const isLocalVideo = peerId === serverId || videoItem.id === 'local-video-container';
        
        // Создаем кнопки управления видео, включая вынесенную отдельно кнопку для включения/выключения камеры
        controls.innerHTML = `
            <button class="video-control-btn zoom-in" title="Увеличить"><i>+</i></button>
            <button class="video-control-btn zoom-out" title="Уменьшить"><i>-</i></button>
            <button class="video-control-btn reset" title="Сбросить"><i>↺</i></button>
        `;
        
        // Создаем отдельную кнопку для включения/выключения камеры
        const cameraButton = document.createElement('button');
        cameraButton.className = 'toggle-camera';
        cameraButton.title = 'Вкл/выкл камеру';
        cameraButton.innerHTML = '<span class="camera-icon">📹</span>';
        videoItem.appendChild(cameraButton);
        
        videoItem.appendChild(controls);
        
        // Добавляем класс для перетаскивания
        videoItem.classList.add('draggable');
        
        // Сохраняем данные о масштабе и смещении для этого видео
        videoElement.dataset.scale = '1.0';
        videoElement.dataset.offsetX = '0';
        videoElement.dataset.offsetY = '0';
        videoElement.dataset.cameraEnabled = 'true'; // Добавляем статус камеры
        
        // Обработчики кнопок управления
        const zoomIn = controls.querySelector('.zoom-in');
        const zoomOut = controls.querySelector('.zoom-out');
        const reset = controls.querySelector('.reset');
        // Находим кнопку включения/выключения камеры, которая теперь находится непосредственно в videoItem, а не в controls
        const toggleCamera = videoItem.querySelector('.toggle-camera');
        
        // Добавляем обработчик для кнопки включения/выключения камеры
        if (toggleCamera) {
            if (isLocalVideo) {
                // Только для локального видео делаем кнопку интерактивной
                toggleCamera.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (localStream) {
                        const videoTrack = localStream.getVideoTracks()[0];
                        if (videoTrack) {
                            if (videoTrack.enabled) {
                                disableLocalCamera();
                            } else {
                                enableLocalCamera();
                            }
                        }
                    }
                });
            } else {
                // Для удаленных видео кнопка только показывает состояние
                toggleCamera.style.pointerEvents = 'none';
                toggleCamera.style.opacity = '0.5';
            }
        }
        
        zoomIn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentScale = parseFloat(videoElement.dataset.scale);
            const newScale = Math.min(currentScale + 0.1, 3.0);
            videoElement.dataset.scale = newScale.toString();
            updateVideoTransform(videoElement);
        });
        
        zoomOut.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentScale = parseFloat(videoElement.dataset.scale);
            const newScale = Math.max(currentScale - 0.1, 0.5);
            videoElement.dataset.scale = newScale.toString();
            updateVideoTransform(videoElement);
        });
        
        reset.addEventListener('click', (e) => {
            e.stopPropagation();
            videoElement.dataset.scale = '1.0';
            videoElement.dataset.offsetX = '0';
            videoElement.dataset.offsetY = '0';
            updateVideoTransform(videoElement);
        });
        
        // Обработчик кнопки включения/выключения камеры
        if (toggleCamera) {
            // Добавляем явное значение атрибута
            if (videoElement.dataset.cameraEnabled === undefined) {
                videoElement.dataset.cameraEnabled = 'true';
            }
            
            // Визуально отображаем текущее состояние кнопки при инициализации
            const cameraIcon = toggleCamera.querySelector('.camera-icon');
            if (cameraIcon) {
                if (videoElement.dataset.cameraEnabled === 'false') {
                    toggleCamera.classList.add('camera-disabled');
                    cameraIcon.textContent = '🚫';
                } else {
                    toggleCamera.classList.remove('camera-disabled');
                    cameraIcon.textContent = '📹';
                }
            }
            
            toggleCamera.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Определяем, включена ли в данный момент камера
                const isCameraEnabled = videoElement.dataset.cameraEnabled === 'true';
                
                // Инвертируем состояние камеры
                videoElement.dataset.cameraEnabled = (!isCameraEnabled).toString();
                
                // Визуально отображаем текущее состояние кнопки
                const cameraIcon = toggleCamera.querySelector('.camera-icon');
                if (cameraIcon) {
                    if (isCameraEnabled) {
                        // Выключаем камеру
                        toggleCamera.classList.add('camera-disabled');
                        cameraIcon.textContent = '🚫'; // Отключенная камера
                        
                        // Для локального видео
                        if (isLocalVideo) {
                            // Отключаем локальную камеру
                            disableLocalCamera();
                        } else {
                            // Отправляем сообщение об отключении камеры для удаленного пользователя
                            sendMessage({
                                type: 'camera_state',
                                targetId: peerId,
                                enabled: false
                            });
                        }
                    } else {
                        // Включаем камеру
                        toggleCamera.classList.remove('camera-disabled');
                        cameraIcon.textContent = '📹'; // Включенная камера
                        
                        // Для локального видео
                        if (isLocalVideo) {
                            // Включаем локальную камеру
                            enableLocalCamera();
                        } else {
                            // Отправляем сообщение о включении камеры для удаленного пользователя
                            sendMessage({
                                type: 'camera_state',
                                targetId: peerId,
                                enabled: true
                            });
                        }
                    }
                }
            });
        }
        
        // Обработчики перетаскивания для видео
        videoElement.addEventListener('mousedown', (e) => {
            // Если видео на весь экран, не позволяем перетаскивать
            const scale = parseFloat(videoElement.dataset.scale);
            if (scale <= 1.0) return;
            
            e.preventDefault();
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startOffsetX = parseFloat(videoElement.dataset.offsetX) || 0;
            const startOffsetY = parseFloat(videoElement.dataset.offsetY) || 0;
            
            const mouseMoveHandler = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                
                videoElement.dataset.offsetX = (startOffsetX + dx).toString();
                videoElement.dataset.offsetY = (startOffsetY + dy).toString();
                
                updateVideoTransform(videoElement);
            };
            
            const mouseUpHandler = () => {
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            };
            
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });
    }
    
    // Функция обновления трансформации видео удалена для совместимости
    function updateVideoTransform(videoElement) {
        // Функция оставлена пустой для совместимости, но больше не используется
    }
    
    // Отключаем создание и отображение контекстного меню для видео
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
    
    // Контекстное меню отключено (right-click на пользователях)

    // Show error message
    // Функция заглушка для обратной совместимости (функционал всплывающего окна для смены номера удален)
    function showOrderIndexChangeDialog() {
        console.log('Order index change dialog functionality has been removed');
        // Ничего не делаем, функционал удален
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorModal.show();
    }

    // Handle window unload to properly disconnect
    window.addEventListener('beforeunload', () => {
        disconnect();
    });
    
    // Обработчик события для изменения имени пользователя по клику на метку имени
    document.addEventListener('click', (e) => {
        // Проверяем, клик был на метке имени локального или удаленного видео
        // Если клик на номере игрока (обрабатывается отдельно), то не запускаем переименование
        
        // Проверим, не кликнули ли на номере
        // Для ведущего кликнуть по номеру игрока не должно вызывать диалог переименования
        const isClickOnOrderIndex = e.target.classList.contains('clickable-order-index') &&
            e.target.textContent.includes('.') && 
            (userRole === 'host' ? !e.target.id.includes('local-username-label') : true);
            
        if (isClickOnOrderIndex) {
            // Если клик на номере, проверяем, в начале строки ли этот клик
            const rect = e.target.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            
            // Определить, где заканчивается номер (перед точкой и пробелом)
            const text = e.target.textContent;
            const dotIndex = text.indexOf('.');
            if (dotIndex !== -1) {
                // Примерная ширина цифры + точки (можно подстроить)
                const digitWidth = 15; // пикселей на символ
                const orderIndexWidth = (dotIndex + 2) * digitWidth; // +2 для точки и пробела
                
                if (clickX <= orderIndexWidth) {
                    // Клик на порядковом номере, не нужно запускать переименование
                    return;
                }
            }
        }
        
        if (e.target.id === 'local-username-label' || 
            (e.target.classList.contains('video-label') && userRole === 'host')) {
            
            const videoItem = e.target.closest('.video-item');
            const originalContent = e.target.innerHTML;
            
            // Если это метка удаленного видео, сохраняем ID пира для переименования
            if (e.target.classList.contains('video-label') && 
                e.target.id !== 'local-username-label' && 
                videoItem && videoItem.dataset.peerId) {
                
                // Установим ID пира, которого будем переименовывать
                currentSettingsPeerId = videoItem.dataset.peerId;
                
                // Получаем текущее имя пира
                const currentPeer = peers.get(currentSettingsPeerId);
                if (!currentPeer) return;
            }
            
            // Скрываем оригинальную метку
            e.target.style.display = 'none';
            
            // Создаем контейнер для редактирования имени
            const editContainer = document.createElement('div');
            editContainer.className = 'username-edit-container';
            
            // Создаем поле ввода и кнопку OK
            // Если редактируем имя другого пользователя, получаем его значение
            let initialName = username;
            if (currentSettingsPeerId !== null && currentSettingsPeerId !== serverId) {
                const peerToRename = peers.get(currentSettingsPeerId);
                if (peerToRename) {
                    initialName = peerToRename.username;
                }
            }
            
            editContainer.innerHTML = `
                <input type="text" class="username-edit-input" value="${initialName}">
                <button class="username-edit-button">OK</button>
            `;
            
            // Добавляем контейнер к родительскому элементу видео
            videoItem.appendChild(editContainer);
            
            const input = editContainer.querySelector('.username-edit-input');
            const okBtn = editContainer.querySelector('.username-edit-button');
            
            // Установить фокус в поле ввода
            input.focus();
            
            // Обработчик для сохранения имени
            const saveUsername = () => {
                const newName = input.value.trim();
                // Добавляем проверку на роль и ID для переименования других участников
                if (userRole === 'host' && currentSettingsPeerId !== null && currentSettingsPeerId !== serverId) {
                    // Ведущий переименовывает другого участника
                    if (newName) {
                        sendMessage({
                            type: 'rename',
                            targetId: currentSettingsPeerId,  // ID участника, которого переименовывают
                            username: newName
                        });
                    }
                } 
                else if (newName && newName !== username) {
                    // Стандартное переименование себя
                    sendMessage({
                        type: 'rename',
                        username: newName
                    });
                }
                
                // Удаляем контейнер редактирования
                if (videoItem.contains(editContainer)) {
                    videoItem.removeChild(editContainer);
                }
                
                // Показываем оригинальную метку
                e.target.style.display = '';
            };
            
            // Обработчик для отмены редактирования (клик вне контейнера)
            const cancelEdit = (event) => {
                if (!editContainer.contains(event.target) && editContainer !== event.target) {
                    saveUsername();
                    document.removeEventListener('click', cancelEdit);
                }
            };
            
            // Слушатели событий для поля ввода и кнопки OK
            okBtn.addEventListener('click', (saveEvent) => {
                saveEvent.stopPropagation();
                saveUsername();
                document.removeEventListener('click', cancelEdit);
            });
            
            input.addEventListener('keypress', (keyEvent) => {
                if (keyEvent.key === 'Enter') {
                    keyEvent.preventDefault();
                    saveUsername();
                    document.removeEventListener('click', cancelEdit);
                }
            });
            
            // Добавляем слушатель для отмены редактирования при клике вне поля
            setTimeout(() => {
                document.addEventListener('click', cancelEdit);
            }, 0);
        }
    });
});
