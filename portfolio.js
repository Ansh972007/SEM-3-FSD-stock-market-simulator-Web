// ===== Portfolio Page Script =====

let portfolioChart = null;
let profitLossChart = null;

// Initialize portfolio page
document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    loadPortfolio();
    // Update portfolio every 3 seconds to sync with market prices
    setInterval(loadPortfolio, 3000);
    
    // Resize charts on window resize
    window.addEventListener('resize', () => {
        setupCharts();
        loadPortfolio();
    });
});

// Load and display portfolio
function loadPortfolio() {
    const portfolio = StorageManager.getPortfolio();
    const cash = StorageManager.getCash();
    const stocks = StockData;
    const portfolioTableBody = document.getElementById('portfolioTableBody');
    const holdingsCount = document.getElementById('holdingsCount');

    // Get current prices from localStorage (synced from market.js)
    const priceData = JSON.parse(localStorage.getItem('stockPrices') || '{}');

    const holdings = Object.keys(portfolio)
        .map(symbol => {
            const holding = portfolio[symbol];
            const stock = stocks.find(s => s.symbol === symbol);
            if (!stock) return null;

            // Get current price from localStorage or use base price
            const currentPrice = priceData[symbol]?.price || stock.basePrice;
            const currentValue = currentPrice * holding.quantity;
            const profitLoss = Utils.calculateProfitLoss(currentPrice, holding.avgPrice, holding.quantity);
            const profitLossPercent = Utils.calculatePercentChange(holding.avgPrice, currentPrice);

            return {
                symbol,
                name: stock.name,
                quantity: holding.quantity,
                avgPrice: holding.avgPrice,
                currentPrice,
                currentValue,
                profitLoss,
                profitLossPercent
            };
        })
        .filter(h => h !== null);

    // Update holdings count
    if (holdingsCount) {
        holdingsCount.textContent = `${holdings.length} ${holdings.length === 1 ? 'stock' : 'stocks'}`;
    }

    // Calculate totals
    let totalValue = cash;
    let totalInvested = 0;
    let totalPL = 0;

    holdings.forEach(holding => {
        totalValue += holding.currentValue;
        totalInvested += holding.avgPrice * holding.quantity;
        totalPL += holding.profitLoss;
    });

    const totalPLPercent = totalInvested > 0 ? ((totalValue - cash - totalInvested) / totalInvested) * 100 : 0;

    // Update dashboard
    updatePortfolioDashboard(totalValue, totalPL, cash, totalInvested);

    // Render table
    if (portfolioTableBody) {
        if (holdings.length === 0) {
            portfolioTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5 text-muted">
                        No holdings yet. <a href="market.html">Start trading</a> to build your portfolio!
                    </td>
                </tr>
            `;
        } else {
            portfolioTableBody.innerHTML = holdings.map(holding => {
                const plClass = holding.profitLoss >= 0 ? 'text-success' : 'text-danger';
                const plIcon = holding.profitLoss >= 0 ? 'arrow-up' : 'arrow-down';

                return `
                    <tr>
                        <td><strong>${holding.symbol}</strong></td>
                        <td>${holding.name}</td>
                        <td>${holding.quantity}</td>
                        <td>${Utils.formatCurrency(holding.avgPrice)}</td>
                        <td>${Utils.formatCurrency(holding.currentPrice)}</td>
                        <td><strong>${Utils.formatCurrency(holding.currentValue)}</strong></td>
                        <td class="${plClass}">
                            <i class="bi bi-${plIcon}-circle"></i>
                            ${Utils.formatCurrency(Math.abs(holding.profitLoss))}
                        </td>
                        <td class="${plClass}">
                            ${Utils.formatPercent(holding.profitLossPercent)}
                        </td>
                        <td>
                            <a href="market.html" class="btn btn-sm btn-primary">
                                <i class="bi bi-graph-up"></i> Trade
                            </a>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Update charts
    updateCharts(holdings, totalValue, cash);
}

// Update portfolio dashboard
function updatePortfolioDashboard(totalValue, totalPL, cash, totalInvested) {
    const portfolioTotalValue = document.getElementById('portfolioTotalValue');
    const portfolioTotalPL = document.getElementById('portfolioTotalPL');
    const portfolioCash = document.getElementById('portfolioCash');
    const portfolioInvested = document.getElementById('portfolioInvested');

    if (portfolioTotalValue) {
        portfolioTotalValue.textContent = Utils.formatCurrency(totalValue);
    }
    if (portfolioTotalPL) {
        portfolioTotalPL.textContent = Utils.formatCurrency(totalPL);
        portfolioTotalPL.className = `dashboard-value ${totalPL >= 0 ? 'text-success' : 'text-danger'}`;
    }
    if (portfolioCash) {
        portfolioCash.textContent = Utils.formatCurrency(cash);
    }
    if (portfolioInvested) {
        portfolioInvested.textContent = Utils.formatCurrency(totalInvested);
    }
}

// Setup charts
function setupCharts() {
    const portfolioCanvas = document.getElementById('portfolioChart');
    const profitLossCanvas = document.getElementById('profitLossChart');

    // Set canvas dimensions
    if (portfolioCanvas) {
        const container = portfolioCanvas.parentElement;
        const width = container ? container.offsetWidth - 40 : 800;
        portfolioCanvas.width = width;
        portfolioCanvas.height = 300;
        portfolioCanvas.style.width = '100%';
        portfolioCanvas.style.height = '300px';
        portfolioChart = portfolioCanvas.getContext('2d');
    }
    if (profitLossCanvas) {
        const container = profitLossCanvas.parentElement;
        const width = container ? container.offsetWidth - 40 : 800;
        profitLossCanvas.width = width;
        profitLossCanvas.height = 300;
        profitLossCanvas.style.width = '100%';
        profitLossCanvas.style.height = '300px';
        profitLossChart = profitLossCanvas.getContext('2d');
    }
}

// Update charts
function updateCharts(holdings, totalValue, cash) {
    // Portfolio Distribution Chart (Pie Chart)
    if (portfolioChart) {
        const canvas = document.getElementById('portfolioChart');
        const ctx = portfolioChart;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (holdings.length === 0 && cash === 0) {
            // No data
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No portfolio data', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        if (holdings.length > 0) {
        const canvas = document.getElementById('portfolioChart');
        const ctx = portfolioChart;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 20;

            // Draw cash slice
        const cashPercent = (cash / totalValue) * 100;
        if (cashPercent > 0) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, 0, (cashPercent / 100) * 2 * Math.PI);
            ctx.closePath();
            ctx.fillStyle = '#6c757d';
            ctx.fill();
        }

        // Draw stock slices
        let currentAngle = (cashPercent / 100) * 2 * Math.PI;
        const colors = [
            '#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0',
            '#6610f2', '#e83e8c', '#fd7e14', '#20c997', '#6f42c1'
        ];

        holdings.forEach((holding, index) => {
            const percent = (holding.currentValue / totalValue) * 100;
            const angle = (percent / 100) * 2 * Math.PI;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();

            // Draw label
            const labelAngle = currentAngle + angle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(holding.symbol, labelX, labelY);

                currentAngle += angle;
            });

            // Draw cash label if significant
            if (cashPercent > 5) {
                const cashAngle = (cashPercent / 100) * Math.PI;
                const cashLabelX = centerX + Math.cos(cashAngle) * (radius * 0.7);
                const cashLabelY = centerY + Math.sin(cashAngle) * (radius * 0.7);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('Cash', cashLabelX, cashLabelY);
            }
        } else if (cash > 0) {
            // Only cash, no holdings
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 20;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#6c757d';
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Cash Only', centerX, centerY);
        }
    }

    // Profit/Loss Bar Chart
    if (profitLossChart && holdings.length > 0) {
        const canvas = document.getElementById('profitLossChart');
        const ctx = profitLossChart;
        const barWidth = canvas.width / (holdings.length + 1);
        const maxPL = Math.max(...holdings.map(h => Math.abs(h.profitLoss)), 100);
        const zeroY = canvas.height - 40;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw zero line
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, zeroY);
        ctx.lineTo(canvas.width - 20, zeroY);
        ctx.stroke();

        // Draw bars
        holdings.forEach((holding, index) => {
            const x = 30 + index * barWidth;
            const barHeight = (Math.abs(holding.profitLoss) / maxPL) * (canvas.height - 80);
            const y = holding.profitLoss >= 0 
                ? zeroY - barHeight 
                : zeroY;

            // Draw bar
            ctx.fillStyle = holding.profitLoss >= 0 ? '#198754' : '#dc3545';
            ctx.fillRect(x, y, barWidth - 10, barHeight);

            // Draw label
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(holding.symbol, x + (barWidth - 10) / 2, canvas.height - 10);

            // Draw value
            ctx.fillStyle = holding.profitLoss >= 0 ? '#198754' : '#dc3545';
            ctx.font = 'bold 10px Arial';
            const valueY = holding.profitLoss >= 0 ? y - 5 : y + barHeight + 15;
            ctx.fillText(
                Utils.formatCurrency(holding.profitLoss),
                x + (barWidth - 10) / 2,
                valueY
            );
        });
    } else if (profitLossChart) {
        // Clear canvas if no holdings
        const canvas = document.getElementById('profitLossChart');
        const ctx = profitLossChart;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
    }
}

// Sync stock prices from market (if available)
function syncStockPrices() {
    // This would ideally get prices from market.js
    // For now, we'll use base prices with some variation
    const portfolio = StorageManager.getPortfolio();
    Object.keys(portfolio).forEach(symbol => {
        const stock = StockData.find(s => s.symbol === symbol);
        if (stock) {
            // In a real implementation, we'd get the current price from market.js
            // For now, we'll simulate it
            stock.currentPrice = Utils.generateRandomPrice(stock.basePrice, 0.02);
        }
    });
}

