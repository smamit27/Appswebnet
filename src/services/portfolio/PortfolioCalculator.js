export class PortfolioCalculator {
  static calculate(holdingsList) {
    let totalMFInvestment = 0;
    let totalMFCurrentValue = 0;
    let totalStockInvestment = 0;
    let totalStockCurrentValue = 0;

    holdingsList.forEach(h => {
      if (h.type === 'mutualFund') {
        totalMFInvestment += parseFloat(h.purchaseValue) || 0;
        totalMFCurrentValue += (parseFloat(h.units) || 0) * (parseFloat(h.nav) || 0);
      } else if (h.type === 'stock') {
        const qty = parseFloat(h.quantity) || 0;
        const avg = parseFloat(h.averagePrice) || 0;
        totalStockInvestment += qty * avg;
        totalStockCurrentValue += qty * (parseFloat(h.currentPrice) || 0);
      }
    });

    const totalInvested = totalMFInvestment + totalStockInvestment;
    const totalCurrent = totalMFCurrentValue + totalStockCurrentValue;
    const overallGainLoss = totalCurrent - totalInvested;
    const absoluteReturn = totalInvested > 0 ? (overallGainLoss / totalInvested) * 100 : 0;
    
    // CAGRs flat approximation
    const cagr = totalInvested > 0 ? (Math.pow(totalCurrent / totalInvested, 1 / 1.2) - 1) * 100 : 0;
    const xirr = cagr * 1.05;

    return {
      totalInvested,
      totalCurrent,
      overallGainLoss,
      absoluteReturn,
      cagr,
      xirr,
      totalMFInvestment,
      totalMFCurrentValue,
      totalStockInvestment,
      totalStockCurrentValue
    };
  }
}
