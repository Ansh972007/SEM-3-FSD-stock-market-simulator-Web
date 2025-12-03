// ===== Theme Manager =====
const ThemeManager = {
    themes: ['light', 'dark', 'neon'],
    currentTheme: 'light',

    init() {
        // Get saved theme or auto-detect based on time
        const savedTheme = StorageManager.getTheme();
        const autoTheme = this.getAutoTheme();
        this.currentTheme = savedTheme || autoTheme;
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
    },

    getAutoTheme() {
        const hour = new Date().getHours();
        // Morning (6 AM - 6 PM): Light, Night (6 PM - 6 AM): Dark
        if (hour >= 6 && hour < 18) {
            return 'light';
        } else {
            return 'dark';
        }
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        StorageManager.setTheme(theme);
        this.currentTheme = theme;
        this.updateThemeToggle();
    },

    toggleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[nextIndex]);
    },

    createThemeToggle() {
        // Remove existing toggle if any
        const existing = document.getElementById('themeToggle');
        if (existing) existing.remove();

        const toggle = document.createElement('button');
        toggle.id = 'themeToggle';
        toggle.className = 'theme-toggle';
        toggle.innerHTML = this.getThemeIcon(this.currentTheme);
        toggle.title = `Current: ${this.currentTheme} (Click to change)`;
        toggle.onclick = () => this.toggleTheme();
        document.body.appendChild(toggle);
        this.updateThemeToggle();
    },

    updateThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.innerHTML = this.getThemeIcon(this.currentTheme);
            toggle.title = `Current: ${this.currentTheme} (Click to change)`;
        }
    },

    getThemeIcon(theme) {
        const icons = {
            light: '☀️',
            dark: '🌙',
            neon: '💎'
        };
        return icons[theme] || '☀️';
    }
};

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

