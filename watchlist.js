// ===== Watchlist Page Script =====

function loadWatchlist() {
    const watchlist = StorageManager.getWatchlist();
    const priceData = JSON.parse(localStorage.getItem('stockPrices') || '{}');
    const container = document.getElementById('watchlistContainer');
    const emptyDiv = document.getElementById('watchlistEmpty');

    if (watchlist.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyDiv) emptyDiv.classList.remove('d-none');
        return;
    }

    if (emptyDiv) emptyDiv.classList.add('d-none');

    if (container) {
        container.innerHTML = watchlist.map(symbol => {
            const stock = StockData.find(s => s.symbol === symbol);
            if (!stock) return '';

            const currentPrice = priceData[symbol]?.price || stock.basePrice;
            const change = priceData[symbol]?.change || 0;
            const changePercent = priceData[symbol]?.changePercent || 0;
            const isPositive = changePercent >= 0;
            const holding = StorageManager.getStockHolding(symbol);
            const sharesOwned = holding ? holding.quantity : 0;

            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card stock-card ${isPositive ? 'positive' : 'negative'}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h4 class="mb-0">${stock.symbol}</h4>
                                    <small class="text-muted">${stock.name}</small>
                                </div>
                                <button class="btn btn-sm btn-warning" onclick="removeFromWatchlist('${symbol}')" title="Remove from watchlist">
                                    <i class="bi bi-star-fill"></i>
                                </button>
                            </div>
                            
                            <div class="mb-3">
                                <div class="h3 mb-1 ${isPositive ? 'text-success' : 'text-danger'}">
                                    ${Utils.formatCurrency(currentPrice)}
                                </div>
                                <div class="stock-change-display ${isPositive ? 'positive' : 'negative'}">
                                    <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}-circle"></i>
                                    ${Utils.formatPercent(changePercent)}
                                </div>
                            </div>

                            <div class="mb-3">
                                <small class="text-muted d-block">Category: <strong>${stock.category}</strong></small>
                                <small class="text-muted d-block">Volume: <strong>${(stock.volume / 1000000).toFixed(1)}M</strong></small>
                                ${sharesOwned > 0 ? `
                                    <small class="text-muted d-block">
                                        <i class="bi bi-wallet2"></i> You own <strong>${sharesOwned}</strong> shares
                                    </small>
                                ` : ''}
                            </div>

                            <div class="d-grid gap-2">
                                <a href="stock-details.html?symbol=${symbol}" class="btn btn-primary btn-sm">
                                    <i class="bi bi-graph-up"></i> View Details
                                </a>
                                <div class="btn-group">
                                    <button class="btn btn-success btn-sm" onclick="openBuyModalFromWatchlist('${symbol}')">
                                        <i class="bi bi-arrow-down-circle"></i> Buy
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="openSellModalFromWatchlist('${symbol}')" ${sharesOwned === 0 ? 'disabled' : ''}>
                                        <i class="bi bi-arrow-up-circle"></i> Sell
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function removeFromWatchlist(symbol) {
    StorageManager.removeFromWatchlist(symbol);
    NotificationManager.info(`${symbol} removed from watchlist`);
    loadWatchlist();
}

function openBuyModalFromWatchlist(symbol) {
    window.location.href = `market.html?buy=${symbol}`;
}

function openSellModalFromWatchlist(symbol) {
    window.location.href = `market.html?sell=${symbol}`;
}

// Initialize watchlist page
if (document.getElementById('watchlistContainer')) {
    document.addEventListener('DOMContentLoaded', () => {
        StorageManager.init();
        loadWatchlist();
        setInterval(loadWatchlist, 3000); // Update every 3 seconds
    });
}

