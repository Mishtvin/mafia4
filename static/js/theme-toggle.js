document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing theme toggle functionality');
    
    // Получаем элементы кнопок переключения темы
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleBtnLogin = document.getElementById('theme-toggle-btn-login');
    
    // Определяем начальное состояние темы
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme = localStorage.getItem('theme');
    
    if (!currentTheme) {
        currentTheme = prefersDarkScheme ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
    }
    
    // Применяем тему при загрузке
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    
    // Обновляем иконки кнопок
    function updateButtonIcons() {
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = currentTheme === 'dark' 
                ? '<span data-feather="sun"></span>' 
                : '<span data-feather="moon"></span>';
        }
        
        if (themeToggleBtnLogin) {
            themeToggleBtnLogin.innerHTML = currentTheme === 'dark' 
                ? '<span data-feather="sun"></span>' 
                : '<span data-feather="moon"></span>';
        }
        
        // Обновляем Feather иконки
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    // Инициализируем иконки
    updateButtonIcons();
    
    // Функция для переключения темы
    function toggleTheme() {
        // Инвертируем тему
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Применяем новую тему
        document.documentElement.setAttribute('data-bs-theme', currentTheme);
        
        // Сохраняем в localStorage
        localStorage.setItem('theme', currentTheme);
        
        // Обновляем иконки
        updateButtonIcons();
    }
    
    // Добавляем обработчики событий для кнопок
    if (themeToggleBtn) {
        console.log('Adding event listener to conference theme toggle button');
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    if (themeToggleBtnLogin) {
        console.log('Adding event listener to login theme toggle button');
        themeToggleBtnLogin.addEventListener('click', toggleTheme);
    }
});