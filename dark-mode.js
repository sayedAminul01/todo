// Universal Dark Mode Handler for all pages
class UniversalDarkMode {
    constructor() {
        this.darkMode = JSON.parse(localStorage.getItem('alienwebDarkMode')) || false;
        this.init();
    }

    init() {
        this.applyTheme();
        this.bindEvents();
    }

    bindEvents() {
        const toggle = document.getElementById('navDarkToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleDarkMode());
        }
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.applyTheme();
        localStorage.setItem('alienwebDarkMode', JSON.stringify(this.darkMode));
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        const toggle = document.getElementById('navDarkToggle');
        if (toggle) {
            toggle.textContent = this.darkMode ? '☀️' : '🌓';
        }
    }
}

// Initialize dark mode for all pages except index.html (which has its own handler)
if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
    document.addEventListener('DOMContentLoaded', () => {
        new UniversalDarkMode();
    });
}
