// ===== Market Page Script =====

let stocks = [];
let priceUpdateInterval = null;

// Initialize market page
document.addEventListener('DOMContentLoaded', () => {
    initializeStocks();
    // Initialize prices in localStorage
    const priceData = {};
    stocks.forEach(stock => {
        priceData[stock.symbol] = {
            price: stock.currentPrice,
            change: stock.change,
            changePercent: stock.changePercent
        };
    });
    localStorage.setItem('stockPrices', JSON.stringify(priceData));
    
    renderStocks();
    setupEventListeners();
    startPriceSimulation();
    updateDashboard();
});

// Initialize stocks with current prices
function initializeStocks() {
    stocks = StockData.map(stock => ({
        ...stock,
        currentPrice: stock.basePrice,
        previousPrice: stock.basePrice,
        change: 0,
        changePercent: 0
    }));
}

// Render stocks to the page
function renderStocks(filteredStocks = null) {
    const container = document.getElementById('stocksContainer');
    const stocksToRender = filteredStocks || stocks;
    const watchlist = StorageManager.getWatchlist();

    if (stocksToRender.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle"></i> No stocks found matching your criteria.
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = stocksToRender.map(stock => {
        const isPositive = stock.changePercent >= 0;
        const isInWatchlist = watchlist.includes(stock.symbol);
        const holding = StorageManager.getStockHolding(stock.symbol);
        const sharesOwned = holding ? holding.quantity : 0;

        return `
            <div class="col-md-6 col-lg-4">
                <div class="stock-card ${isPositive ? 'positive' : 'negative'}" data-symbol="${stock.symbol}">
                    <div class="stock-card-header">
                        <div>
                            <div class="stock-symbol">${stock.symbol}</div>
                            <div class="stock-company">${stock.name}</div>
                        </div>
                        <button class="btn btn-sm watchlist-btn ${isInWatchlist ? 'active' : ''}" 
                                onclick="toggleWatchlist('${stock.symbol}')" 
                                title="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
                            <i class="bi bi-star${isInWatchlist ? '-fill' : ''}"></i>
                        </button>
                    </div>
                    <div class="stock-price-display ${isPositive ? 'positive' : 'negative'}" 
                         id="price-${stock.symbol}">
                        ${Utils.formatCurrency(stock.currentPrice)}
                    </div>
                    <div class="stock-change-display ${isPositive ? 'positive' : 'negative'}" 
                         id="change-${stock.symbol}">
                        <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}-circle"></i>
                        ${Utils.formatPercent(stock.changePercent)}
                    </div>
                    <div class="mt-2">
                        <small class="text-muted d-block">
                            <i class="bi bi-tag"></i> ${stock.category}
                        </small>
                        <small class="text-muted d-block">
                            <i class="bi bi-graph-up"></i> Vol: ${(stock.volume / 1000000).toFixed(1)}M
                        </small>
                        ${sharesOwned > 0 ? `
                            <small class="text-muted d-block mt-1">
                                <i class="bi bi-wallet2"></i> You own ${sharesOwned} shares
                            </small>
                        ` : ''}
                    </div>
                    <div class="stock-actions mt-2">
                        <a href="stock-details.html?symbol=${stock.symbol}" class="btn btn-info btn-sm w-100 mb-2">
                            <i class="bi bi-graph-up"></i> View Details
                        </a>
                    </div>
                    <div class="stock-actions">
                        <button class="btn btn-success btn-action" 
                                onclick="openBuyModal('${stock.symbol}')">
                            <i class="bi bi-arrow-down-circle"></i> Buy
                        </button>
                        <button class="btn btn-danger btn-action" 
                                onclick="openSellModal('${stock.symbol}')"
                                ${sharesOwned === 0 ? 'disabled' : ''}>
                            <i class="bi bi-arrow-up-circle"></i> Sell
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchStocks');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Filter buttons
    const filterAll = document.getElementById('filterAll');
    const filterGainers = document.getElementById('filterGainers');
    const filterLosers = document.getElementById('filterLosers');
    const filterWatchlist = document.getElementById('filterWatchlist');
    const categoryFilter = document.getElementById('categoryFilter');

    if (filterAll) filterAll.addEventListener('change', handleFilter);
    if (filterGainers) filterGainers.addEventListener('change', handleFilter);
    if (filterLosers) filterLosers.addEventListener('change', handleFilter);
    if (filterWatchlist) filterWatchlist.addEventListener('change', handleFilter);
    if (categoryFilter) categoryFilter.addEventListener('change', handleFilter);

    // Buy modal
    const buyQuantityInput = document.getElementById('buyStockQuantity');
    if (buyQuantityInput) {
        buyQuantityInput.addEventListener('input', calculateBuyTotal);
    }

    const confirmBuyBtn = document.getElementById('confirmBuyBtn');
    if (confirmBuyBtn) {
        confirmBuyBtn.addEventListener('click', handleBuyStock);
    }

    // Sell modal
    const sellQuantityInput = document.getElementById('sellStockQuantity');
    if (sellQuantityInput) {
        sellQuantityInput.addEventListener('input', calculateSellTotal);
    }

    const confirmSellBtn = document.getElementById('confirmSellBtn');
    if (confirmSellBtn) {
        confirmSellBtn.addEventListener('click', handleSellStock);
    }
}

// Handle search
function handleSearch(e) {
    applyFilters();
}

// Apply all filters
function applyFilters() {
    const query = document.getElementById('searchStocks')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const filterAll = document.getElementById('filterAll')?.checked;
    const filterGainers = document.getElementById('filterGainers')?.checked;
    const filterLosers = document.getElementById('filterLosers')?.checked;
    const filterWatchlist = document.getElementById('filterWatchlist')?.checked;
    const watchlist = StorageManager.getWatchlist();

    let filtered = stocks;

    // Search filter
    if (query) {
        filtered = filtered.filter(stock => 
            stock.symbol.toLowerCase().includes(query) ||
            stock.name.toLowerCase().includes(query)
        );
    }

    // Category filter
    if (category) {
        filtered = filtered.filter(stock => stock.category === category);
    }

    // Change filter
    if (filterGainers) {
        filtered = filtered.filter(s => s.changePercent > 0);
    } else if (filterLosers) {
        filtered = filtered.filter(s => s.changePercent < 0);
    } else if (filterWatchlist) {
        filtered = filtered.filter(s => watchlist.includes(s.symbol));
    }

    renderStocks(filtered);
}

// Handle filter
function handleFilter() {
    applyFilters();
}

// Toggle watchlist
function toggleWatchlist(symbol) {
    if (StorageManager.isInWatchlist(symbol)) {
        StorageManager.removeFromWatchlist(symbol);
        NotificationManager.info(`${symbol} removed from watchlist`);
    } else {
        StorageManager.addToWatchlist(symbol);
        NotificationManager.success(`${symbol} added to watchlist`);
    }
    renderStocks();
}

// Open buy modal
function openBuyModal(symbol) {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    const modal = new bootstrap.Modal(document.getElementById('buyStockModal'));
    document.getElementById('buyStockSymbol').value = symbol;
    document.getElementById('buyStockName').value = `${stock.symbol} - ${stock.name}`;
    document.getElementById('buyStockPrice').value = Utils.formatCurrency(stock.currentPrice);
    document.getElementById('buyStockQuantity').value = '';
    document.getElementById('buyTotalAmount').value = Utils.formatCurrency(0);
    document.getElementById('buyValidationMessage').textContent = '';

    modal.show();
}

// Calculate buy total
function calculateBuyTotal() {
    const symbol = document.getElementById('buyStockSymbol').value;
    const quantity = parseInt(document.getElementById('buyStockQuantity').value) || 0;
    const stock = stocks.find(s => s.symbol === symbol);
    const validationMsg = document.getElementById('buyValidationMessage');

    if (!stock) return;

    const total = stock.currentPrice * quantity;
    document.getElementById('buyTotalAmount').value = Utils.formatCurrency(total);

    const cash = StorageManager.getCash();
    if (quantity > 0 && total > cash) {
        validationMsg.textContent = `Insufficient funds. You have ${Utils.formatCurrency(cash)} available.`;
        validationMsg.className = 'alert alert-danger';
    } else if (quantity <= 0) {
        validationMsg.textContent = 'Please enter a valid quantity (greater than 0).';
        validationMsg.className = 'alert alert-warning';
    } else {
        validationMsg.textContent = '';
    }
}

// Handle buy stock
function handleBuyStock() {
    const symbol = document.getElementById('buyStockSymbol').value;
    const quantity = parseInt(document.getElementById('buyStockQuantity').value);

    if (!quantity || quantity <= 0) {
        NotificationManager.error('Please enter a valid quantity');
        return;
    }

    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    const total = stock.currentPrice * quantity;
    const cash = StorageManager.getCash();

    if (total > cash) {
        NotificationManager.error('Insufficient funds');
        return;
    }

    // Execute buy
    StorageManager.subtractCash(total);
    StorageManager.addToPortfolio(symbol, quantity, stock.currentPrice);
    StorageManager.addTradeHistory({
        type: 'buy',
        symbol: symbol,
        companyName: stock.name,
        quantity: quantity,
        price: stock.currentPrice,
        totalAmount: total
    });

    NotificationManager.success(`Successfully bought ${quantity} ${symbol} shares!`);
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('buyStockModal'));
    modal.hide();

    updateDashboard();
    renderStocks();
}

// Open sell modal
function openSellModal(symbol) {
    const stock = stocks.find(s => s.symbol === symbol);
    const holding = StorageManager.getStockHolding(symbol);

    if (!stock || !holding || holding.quantity === 0) {
        NotificationManager.warning('You don\'t own any shares of this stock');
        return;
    }

    const modal = new bootstrap.Modal(document.getElementById('sellStockModal'));
    document.getElementById('sellStockSymbol').value = symbol;
    document.getElementById('sellStockName').value = `${stock.symbol} - ${stock.name}`;
    document.getElementById('sellStockPrice').value = Utils.formatCurrency(stock.currentPrice);
    document.getElementById('sellSharesOwned').value = holding.quantity;
    document.getElementById('sellAvgPrice').value = Utils.formatCurrency(holding.avgPrice);
    document.getElementById('sellStockQuantity').value = '';
    document.getElementById('sellStockQuantity').max = holding.quantity;
    document.getElementById('sellTotalAmount').value = Utils.formatCurrency(0);
    document.getElementById('sellProfitLoss').value = Utils.formatCurrency(0);
    document.getElementById('sellValidationMessage').textContent = '';

    modal.show();
}

// Calculate sell total
function calculateSellTotal() {
    const symbol = document.getElementById('sellStockSymbol').value;
    const quantity = parseInt(document.getElementById('sellStockQuantity').value) || 0;
    const stock = stocks.find(s => s.symbol === symbol);
    const holding = StorageManager.getStockHolding(symbol);
    const validationMsg = document.getElementById('sellValidationMessage');

    if (!stock || !holding) return;

    const total = stock.currentPrice * quantity;
    const profitLoss = Utils.calculateProfitLoss(stock.currentPrice, holding.avgPrice, quantity);
    const profitLossPercent = Utils.calculatePercentChange(holding.avgPrice, stock.currentPrice);

    document.getElementById('sellTotalAmount').value = Utils.formatCurrency(total);
    
    const profitLossElement = document.getElementById('sellProfitLoss');
    profitLossElement.value = Utils.formatCurrency(profitLoss);
    profitLossElement.className = `form-control fw-bold ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`;

    if (quantity > holding.quantity) {
        validationMsg.textContent = `You can only sell ${holding.quantity} shares.`;
        validationMsg.className = 'alert alert-danger';
    } else if (quantity <= 0) {
        validationMsg.textContent = 'Please enter a valid quantity (greater than 0).';
        validationMsg.className = 'alert alert-warning';
    } else {
        validationMsg.textContent = `Estimated ${profitLoss >= 0 ? 'profit' : 'loss'}: ${Utils.formatPercent(profitLossPercent)}`;
        validationMsg.className = `alert ${profitLoss >= 0 ? 'alert-success' : 'alert-danger'}`;
    }
}

// Handle sell stock
function handleSellStock() {
    const symbol = document.getElementById('sellStockSymbol').value;
    const quantity = parseInt(document.getElementById('sellStockQuantity').value);

    if (!quantity || quantity <= 0) {
        NotificationManager.error('Please enter a valid quantity');
        return;
    }

    const stock = stocks.find(s => s.symbol === symbol);
    const holding = StorageManager.getStockHolding(symbol);

    if (!stock || !holding || quantity > holding.quantity) {
        NotificationManager.error('Invalid transaction');
        return;
    }

    const total = stock.currentPrice * quantity;
    const profitLoss = Utils.calculateProfitLoss(stock.currentPrice, holding.avgPrice, quantity);

    // Execute sell
    StorageManager.addCash(total);
    StorageManager.removeFromPortfolio(symbol, quantity);
    StorageManager.addTradeHistory({
        type: 'sell',
        symbol: symbol,
        companyName: stock.name,
        quantity: quantity,
        price: stock.currentPrice,
        totalAmount: total,
        profitLoss: profitLoss
    });

    const profitLossText = profitLoss >= 0 
        ? `Profit: ${Utils.formatCurrency(profitLoss)}`
        : `Loss: ${Utils.formatCurrency(Math.abs(profitLoss))}`;

    NotificationManager.success(`Sold ${quantity} ${symbol} shares! ${profitLossText}`);
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('sellStockModal'));
    modal.hide();

    updateDashboard();
    renderStocks();
}

// Start price simulation
function startPriceSimulation() {
    priceUpdateInterval = setInterval(() => {
        stocks.forEach(stock => {
            stock.previousPrice = stock.currentPrice;
            stock.currentPrice = Utils.generateRandomPrice(stock.currentPrice, 0.02);
            stock.change = stock.currentPrice - stock.previousPrice;
            stock.changePercent = Utils.calculatePercentChange(stock.previousPrice, stock.currentPrice);

            // Save current prices to localStorage for portfolio sync
            const priceData = JSON.parse(localStorage.getItem('stockPrices') || '{}');
            priceData[stock.symbol] = {
                price: stock.currentPrice,
                change: stock.change,
                changePercent: stock.changePercent
            };
            localStorage.setItem('stockPrices', JSON.stringify(priceData));

            // Update price display with animation
            const priceElement = document.getElementById(`price-${stock.symbol}`);
            const changeElement = document.getElementById(`change-${stock.symbol}`);
            const cardElement = document.querySelector(`[data-symbol="${stock.symbol}"]`);

            if (priceElement) {
                priceElement.textContent = Utils.formatCurrency(stock.currentPrice);
                priceElement.classList.add('price-update');
                setTimeout(() => priceElement.classList.remove('price-update'), 500);

                const isPositive = stock.changePercent >= 0;
                priceElement.className = `stock-price-display ${isPositive ? 'positive' : 'negative'}`;
            }

            if (changeElement) {
                changeElement.innerHTML = `
                    <i class="bi bi-arrow-${stock.changePercent >= 0 ? 'up' : 'down'}-circle"></i>
                    ${Utils.formatPercent(stock.changePercent)}
                `;
                changeElement.className = `stock-change-display ${stock.changePercent >= 0 ? 'positive' : 'negative'}`;
            }

            if (cardElement) {
                cardElement.className = `stock-card ${stock.changePercent >= 0 ? 'positive' : 'negative'}`;
            }
        });

        updateDashboard();
    }, 3000); // Update every 3 seconds
}

// Update dashboard
function updateDashboard() {
    const portfolio = StorageManager.getPortfolio();
    const cash = StorageManager.getCash();
    let totalValue = cash;
    let totalInvested = 0;

    Object.keys(portfolio).forEach(symbol => {
        const holding = portfolio[symbol];
        const stock = stocks.find(s => s.symbol === symbol);
        if (stock) {
            const currentValue = stock.currentPrice * holding.quantity;
            totalValue += currentValue;
            totalInvested += holding.totalInvested;
        }
    });

    const totalPL = totalValue - 10000; // Starting cash was 10000

    const totalPortfolioValue = document.getElementById('totalPortfolioValue');
    const totalProfitLoss = document.getElementById('totalProfitLoss');
    const availableCash = document.getElementById('availableCash');
    const totalInvestments = document.getElementById('totalInvestments');

    if (totalPortfolioValue) {
        totalPortfolioValue.textContent = Utils.formatCurrency(totalValue);
        totalPortfolioValue.className = `dashboard-value ${totalPL >= 0 ? 'text-success' : 'text-danger'}`;
    }
    if (totalProfitLoss) {
        totalProfitLoss.textContent = Utils.formatCurrency(totalPL);
        totalProfitLoss.className = `dashboard-value ${totalPL >= 0 ? 'text-success' : 'text-danger'}`;
    }
    if (availableCash) availableCash.textContent = Utils.formatCurrency(cash);
    if (totalInvestments) totalInvestments.textContent = Utils.formatCurrency(totalInvested);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
});

