// ===== Prediction Manager (Fake AI Simulation) =====
const PredictionManager = {
    generatePrediction(stock) {
        const priceData = JSON.parse(localStorage.getItem('stockPrices') || '{}');
        const currentPrice = priceData[stock.symbol]?.price || stock.basePrice;
        const changePercent = priceData[stock.symbol]?.changePercent || 0;
        const volume = stock.volume || 1000000;

        // Simulate AI prediction based on various factors
        const volatility = Math.abs(changePercent);
        const volumeFactor = volume > 20000000 ? 'high' : volume > 10000000 ? 'medium' : 'low';
        const trend = changePercent > 0 ? 'bullish' : changePercent < 0 ? 'bearish' : 'neutral';

        // Generate prediction score (0-100)
        let predictionScore = 50; // Base score

        // Adjust based on trend
        if (trend === 'bullish') predictionScore += 15;
        if (trend === 'bearish') predictionScore -= 15;

        // Adjust based on volatility
        if (volatility > 5) predictionScore -= 10; // High volatility = risky
        if (volatility < 1) predictionScore += 5; // Low volatility = stable

        // Adjust based on volume
        if (volumeFactor === 'high') predictionScore += 10;
        if (volumeFactor === 'low') predictionScore -= 5;

        // Add some randomness
        predictionScore += (Math.random() - 0.5) * 10;
        predictionScore = Math.max(0, Math.min(100, predictionScore));

        // Generate prediction text
        let predictionText = '';
        let predictionClass = '';
        let recommendation = '';

        if (predictionScore >= 70) {
            predictionText = 'Strong Buy Signal';
            predictionClass = 'success';
            recommendation = 'High probability of price increase. Consider buying.';
        } else if (predictionScore >= 55) {
            predictionText = 'Buy Signal';
            predictionClass = 'info';
            recommendation = 'Moderate chance of price increase. Good buying opportunity.';
        } else if (predictionScore >= 45) {
            predictionText = 'Hold';
            predictionClass = 'warning';
            recommendation = 'Market is neutral. Hold your position or wait for better entry.';
        } else if (predictionScore >= 30) {
            predictionText = 'Sell Signal';
            predictionClass = 'warning';
            recommendation = 'Moderate chance of price decrease. Consider selling.';
        } else {
            predictionText = 'Strong Sell Signal';
            predictionClass = 'danger';
            recommendation = 'High probability of price decrease. Consider selling.';
        }

        // Generate insights
        const insights = this.generateInsights(stock, changePercent, volatility, volumeFactor);

        // Render prediction
        const content = document.getElementById('predictionContent');
        if (content) {
            content.innerHTML = `
                <div class="text-center mb-3">
                    <div class="h2 mb-2">
                        <span class="badge bg-${predictionClass} p-3">${predictionText}</span>
                    </div>
                    <div class="progress mb-3" style="height: 25px;">
                        <div class="progress-bar bg-${predictionClass}" role="progressbar" 
                             style="width: ${predictionScore}%">
                            ${Math.round(predictionScore)}% Confidence
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-${predictionClass}">
                    <strong><i class="bi bi-lightbulb"></i> Recommendation:</strong><br>
                    ${recommendation}
                </div>

                <hr>

                <h6><i class="bi bi-graph-up"></i> Market Insights:</h6>
                <ul class="list-unstyled">
                    ${insights.map(insight => `<li class="mb-2"><i class="bi bi-check-circle text-${insight.class}"></i> ${insight.text}</li>`).join('')}
                </ul>

                <div class="mt-3 p-2 bg-light rounded">
                    <small class="text-muted">
                        <i class="bi bi-info-circle"></i> 
                        This is a simulated prediction for educational purposes only.
                    </small>
                </div>
            `;
        }
    },

    generateInsights(stock, changePercent, volatility, volumeFactor) {
        const insights = [];

        // Trend insight
        if (changePercent > 2) {
            insights.push({
                text: `Strong upward trend (+${changePercent.toFixed(2)}% today)`,
                class: 'success'
            });
        } else if (changePercent < -2) {
            insights.push({
                text: `Downward trend (${changePercent.toFixed(2)}% today)`,
                class: 'danger'
            });
        } else {
            insights.push({
                text: 'Price movement is relatively stable',
                class: 'info'
            });
        }

        // Volatility insight
        if (volatility > 5) {
            insights.push({
                text: 'High volatility detected - higher risk',
                class: 'warning'
            });
        } else if (volatility < 1) {
            insights.push({
                text: 'Low volatility - stable price movement',
                class: 'success'
            });
        }

        // Volume insight
        if (volumeFactor === 'high') {
            insights.push({
                text: `High trading volume (${(stock.volume / 1000000).toFixed(1)}M) - strong market interest`,
                class: 'info'
            });
        } else if (volumeFactor === 'low') {
            insights.push({
                text: 'Lower trading volume - less market activity',
                class: 'warning'
            });
        }

        // Category insight
        const categoryTrends = {
            'Tech': 'Technology sector showing mixed signals',
            'Auto': 'Automotive sector experiencing moderate activity',
            'Bank': 'Banking sector remains stable',
            'Pharma': 'Pharmaceutical sector showing steady growth',
            'Energy': 'Energy sector volatile due to market conditions'
        };
        insights.push({
            text: categoryTrends[stock.category] || `${stock.category} sector performance`,
            class: 'info'
        });

        return insights;
    }
};

