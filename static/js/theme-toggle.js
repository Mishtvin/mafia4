// Функция для настройки переключения между светлой и темной темой
function setupLightDarkThemeToggle() {
    console.log('Initializing theme toggle functionality');
    
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleBtnLogin = document.getElementById('theme-toggle-btn-login');
    
    // Определить начальное состояние темы
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme = localStorage.getItem('theme');
    
    if (!currentTheme) {
        currentTheme = prefersDarkScheme ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
    }
    
    // Применить тему при загрузке
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    
    // Обновить иконки кнопок
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
    
    // Обновляем иконки
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Функция для переключения темы
    function toggleTheme() {
        // Инвертировать тему
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        
        // Сохранить в localStorage
        localStorage.setItem('theme', newTheme);
        
        // Обновить текущую тему
        currentTheme = newTheme;
        
        // Обновить иконки кнопок
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
        
        // Обновить иконки
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    // Слушатель для кнопки переключения в конференции
    if (themeToggleBtn) {
        console.log('Adding event listener to conference theme toggle button');
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Слушатель для кнопки переключения на экране входа
    if (themeToggleBtnLogin) {
        console.log('Adding event listener to login theme toggle button');
        themeToggleBtnLogin.addEventListener('click', toggleTheme);
    }
}

// Запускаем настройку темы при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    setupLightDarkThemeToggle();
});