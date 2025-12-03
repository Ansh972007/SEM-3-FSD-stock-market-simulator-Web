// ===== Trade History Page Script =====

function loadTradeHistory(filter = 'all') {
    const history = StorageManager.getTradeHistory();
    let filteredHistory = history;

    if (filter === 'buy') {
        filteredHistory = history.filter(trade => trade.type === 'buy');
    } else if (filter === 'sell') {
        filteredHistory = history.filter(trade => trade.type === 'sell');
    }

    const historyTableBody = document.getElementById('historyTableBody');
    const historyCount = document.getElementById('historyCount');

    if (historyCount) {
        historyCount.textContent = `${filteredHistory.length} transactions`;
    }

    if (!historyTableBody) return;

    if (filteredHistory.length === 0) {
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-muted">
                    No trade history found.
                </td>
            </tr>
        `;
        return;
    }

    historyTableBody.innerHTML = filteredHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(trade => {
            const date = new Date(trade.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            const typeClass = trade.type === 'buy' ? 'success' : 'danger';
            const typeIcon = trade.type === 'buy' ? 'arrow-down-circle' : 'arrow-up-circle';
            const profitLoss = trade.profitLoss || 0;
            const profitLossClass = profitLoss >= 0 ? 'text-success' : 'text-danger';
            const profitLossIcon = profitLoss >= 0 ? '+' : '';

            return `
                <tr>
                    <td>${dateStr}<br><small class="text-muted">${timeStr}</small></td>
                    <td><span class="badge bg-${typeClass}"><i class="bi bi-${typeIcon}"></i> ${trade.type.toUpperCase()}</span></td>
                    <td><strong>${trade.symbol}</strong></td>
                    <td>${trade.companyName}</td>
                    <td>${trade.quantity}</td>
                    <td>$${trade.price.toFixed(2)}</td>
                    <td><strong>$${trade.totalAmount.toFixed(2)}</strong></td>
                    <td class="${profitLossClass}">
                        ${trade.type === 'sell' ? `${profitLossIcon}$${Math.abs(profitLoss).toFixed(2)}` : '-'}
                    </td>
                </tr>
            `;
        })
        .join('');
}

// Initialize history page
if (document.getElementById('historyTableBody')) {
    document.addEventListener('DOMContentLoaded', () => {
        StorageManager.init();

        const filterAllTrades = document.getElementById('filterAllTrades');
        const filterBuys = document.getElementById('filterBuys');
        const filterSells = document.getElementById('filterSells');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');

        if (filterAllTrades) {
            filterAllTrades.addEventListener('change', () => {
                if (filterAllTrades.checked) loadTradeHistory('all');
            });
        }

        if (filterBuys) {
            filterBuys.addEventListener('change', () => {
                if (filterBuys.checked) loadTradeHistory('buy');
            });
        }

        if (filterSells) {
            filterSells.addEventListener('change', () => {
                if (filterSells.checked) loadTradeHistory('sell');
            });
        }

        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all trade history? This action cannot be undone.')) {
                    StorageManager.clearTradeHistory();
                    loadTradeHistory();
                }
            });
        }

        loadTradeHistory();
    });
}

