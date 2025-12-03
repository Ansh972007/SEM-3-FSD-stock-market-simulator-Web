// ===== Storage Manager =====
const StorageManager = {
    // Initialize default data
    init() {
        if (!localStorage.getItem('cash')) {
            localStorage.setItem('cash', '10000');
        }
        if (!localStorage.getItem('portfolio')) {
            localStorage.setItem('portfolio', JSON.stringify({}));
        }
        if (!localStorage.getItem('tradeHistory')) {
            localStorage.setItem('tradeHistory', JSON.stringify([]));
        }
        if (!localStorage.getItem('watchlist')) {
            localStorage.setItem('watchlist', JSON.stringify([]));
        }
        if (!localStorage.getItem('theme')) {
            localStorage.setItem('theme', 'light');
        }
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', '');
        }
    },

    // Cash Management
    getCash() {
        return parseFloat(localStorage.getItem('cash')) || 10000;
    },

    setCash(amount) {
        localStorage.setItem('cash', amount.toString());
    },

    addCash(amount) {
        const current = this.getCash();
        this.setCash(current + amount);
    },

    subtractCash(amount) {
        const current = this.getCash();
        this.setCash(current - amount);
    },

    // Portfolio Management
    getPortfolio() {
        return JSON.parse(localStorage.getItem('portfolio')) || {};
    },

    setPortfolio(portfolio) {
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
    },

    getStockHolding(symbol) {
        const portfolio = this.getPortfolio();
        return portfolio[symbol] || null;
    },

    addToPortfolio(symbol, quantity, price) {
        const portfolio = this.getPortfolio();
        if (portfolio[symbol]) {
            // Calculate new average price
            const existing = portfolio[symbol];
            const totalCost = (existing.quantity * existing.avgPrice) + (quantity * price);
            const totalQuantity = existing.quantity + quantity;
            portfolio[symbol] = {
                quantity: totalQuantity,
                avgPrice: totalCost / totalQuantity,
                totalInvested: totalCost
            };
        } else {
            portfolio[symbol] = {
                quantity: quantity,
                avgPrice: price,
                totalInvested: quantity * price
            };
        }
        this.setPortfolio(portfolio);
    },

    removeFromPortfolio(symbol, quantity) {
        const portfolio = this.getPortfolio();
        if (portfolio[symbol]) {
            portfolio[symbol].quantity -= quantity;
            if (portfolio[symbol].quantity <= 0) {
                delete portfolio[symbol];
            } else {
                // Recalculate total invested
                portfolio[symbol].totalInvested = portfolio[symbol].quantity * portfolio[symbol].avgPrice;
            }
            this.setPortfolio(portfolio);
        }
    },

    // Trade History
    getTradeHistory() {
        return JSON.parse(localStorage.getItem('tradeHistory')) || [];
    },

    addTradeHistory(trade) {
        const history = this.getTradeHistory();
        history.push({
            ...trade,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('tradeHistory', JSON.stringify(history));
    },

    clearTradeHistory() {
        localStorage.setItem('tradeHistory', JSON.stringify([]));
    },

    // Watchlist Management
    getWatchlist() {
        return JSON.parse(localStorage.getItem('watchlist')) || [];
    },

    addToWatchlist(symbol) {
        const watchlist = this.getWatchlist();
        if (!watchlist.includes(symbol)) {
            watchlist.push(symbol);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
        }
    },

    removeFromWatchlist(symbol) {
        const watchlist = this.getWatchlist();
        const filtered = watchlist.filter(s => s !== symbol);
        localStorage.setItem('watchlist', JSON.stringify(filtered));
    },

    isInWatchlist(symbol) {
        return this.getWatchlist().includes(symbol);
    },

    // Theme Management
    getTheme() {
        return localStorage.getItem('theme') || 'light';
    },

    setTheme(theme) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },

    // User Management
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    },

    addUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    },

    getUser(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username);
    },

    setCurrentUser(username) {
        localStorage.setItem('currentUser', username);
    },

    getCurrentUser() {
        return localStorage.getItem('currentUser') || '';
    },

    logout() {
        localStorage.setItem('currentUser', '');
    }
};

// ===== Notification System =====
const NotificationManager = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-close" onclick="this.parentElement.remove()">&times;</span>
            <strong>${this.getTypeLabel(type)}</strong><br>
            ${message}
        `;

        container.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInNotification 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    },

    getTypeLabel(type) {
        const labels = {
            success: 'Success',
            danger: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        return labels[type] || 'Info';
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'danger', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    },

    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

// ===== Utility Functions =====
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },

    formatPercent(value) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    },

    calculateProfitLoss(currentPrice, avgPrice, quantity) {
        return (currentPrice - avgPrice) * quantity;
    },

    calculatePercentChange(oldPrice, newPrice) {
        return ((newPrice - oldPrice) / oldPrice) * 100;
    },

    getRandomChange(min = -3, max = 3) {
        return (Math.random() * (max - min) + min) / 100;
    },

    generateRandomPrice(basePrice, volatility = 0.02) {
        const change = this.getRandomChange(-volatility * 100, volatility * 100);
        const newPrice = basePrice * (1 + change);
        return Math.max(0.01, newPrice); // Ensure price doesn't go negative
    }
};

// ===== Stock Data =====
const StockData = [
    { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 175.50, category: 'Tech', volume: 45000000, description: 'Technology company known for iPhone, iPad, Mac, and services.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', basePrice: 378.90, category: 'Tech', volume: 28000000, description: 'Leading software and cloud services provider.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 142.30, category: 'Tech', volume: 32000000, description: 'Parent company of Google and other subsidiaries.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 145.80, category: 'Tech', volume: 38000000, description: 'E-commerce and cloud computing giant.' },
    { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 248.50, category: 'Auto', volume: 95000000, description: 'Electric vehicle and clean energy company.' },
    { symbol: 'META', name: 'Meta Platforms Inc.', basePrice: 312.40, category: 'Tech', volume: 22000000, description: 'Social media and virtual reality company.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', basePrice: 485.20, category: 'Tech', volume: 55000000, description: 'Graphics processing and AI technology leader.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', basePrice: 156.70, category: 'Bank', volume: 15000000, description: 'Largest bank in the United States.' },
    { symbol: 'V', name: 'Visa Inc.', basePrice: 245.60, category: 'Finance', volume: 8500000, description: 'Global payments technology company.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', basePrice: 158.90, category: 'Pharma', volume: 12000000, description: 'Healthcare and pharmaceutical corporation.' },
    { symbol: 'WMT', name: 'Walmart Inc.', basePrice: 162.40, category: 'Retail', volume: 18000000, description: 'World\'s largest retailer.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', basePrice: 152.30, category: 'Consumer', volume: 10000000, description: 'Consumer goods manufacturing company.' },
    { symbol: 'MA', name: 'Mastercard Inc.', basePrice: 398.50, category: 'Finance', volume: 6500000, description: 'Global payment processing corporation.' },
    { symbol: 'DIS', name: 'The Walt Disney Company', basePrice: 95.80, category: 'Media', volume: 14000000, description: 'Entertainment and media conglomerate.' },
    { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 425.60, category: 'Media', volume: 8000000, description: 'Streaming entertainment service provider.' },
    { symbol: 'BAC', name: 'Bank of America Corp.', basePrice: 33.20, category: 'Bank', volume: 45000000, description: 'Major American banking institution.' },
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', basePrice: 108.40, category: 'Energy', volume: 25000000, description: 'Oil and gas exploration company.' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.', basePrice: 52.70, category: 'Tech', volume: 16000000, description: 'Networking and cybersecurity solutions.' },
    { symbol: 'PFE', name: 'Pfizer Inc.', basePrice: 28.90, category: 'Pharma', volume: 35000000, description: 'Pharmaceutical and biotechnology company.' },
    { symbol: 'INTC', name: 'Intel Corporation', basePrice: 42.50, category: 'Tech', volume: 30000000, description: 'Semiconductor chip manufacturer.' },
    { symbol: 'F', name: 'Ford Motor Company', basePrice: 12.80, category: 'Auto', volume: 55000000, description: 'American automobile manufacturer.' },
    { symbol: 'GM', name: 'General Motors', basePrice: 38.40, category: 'Auto', volume: 18000000, description: 'Automotive manufacturing company.' },
    { symbol: 'NKE', name: 'Nike Inc.', basePrice: 98.20, category: 'Retail', volume: 12000000, description: 'Athletic footwear and apparel company.' },
    { symbol: 'KO', name: 'The Coca-Cola Company', basePrice: 58.70, category: 'Consumer', volume: 15000000, description: 'Beverage manufacturing corporation.' },
    { symbol: 'PEP', name: 'PepsiCo Inc.', basePrice: 168.30, category: 'Consumer', volume: 8000000, description: 'Food and beverage company.' }
];

// Initialize storage on page load
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.init();
});

