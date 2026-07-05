export class PortfolioComparison {
  static compare(currentSummary, previousSummary) {
    if (!previousSummary) {
      return {
        monthlyGain: 0,
        monthlyReturn: 0,
        growthDetected: true,
        detail: 'Initial import. Comparative monthly insights will be visible once subsequent months are uploaded.'
      };
    }

    const currentVal = parseFloat(currentSummary.totalCurrent) || 0;
    const prevVal = parseFloat(previousSummary.totalCurrent) || 0;

    const monthlyGain = currentVal - prevVal;
    const monthlyReturn = prevVal > 0 ? (monthlyGain / prevVal) * 100 : 0;

    return {
      monthlyGain,
      monthlyReturn,
      growthDetected: monthlyGain >= 0,
      detail: monthlyGain >= 0 
        ? `Portfolio value grew by ₹${monthlyGain.toLocaleString('en-IN')} (+${monthlyReturn.toFixed(2)}%) since last statement.`
        : `Portfolio value adjusted by -₹${Math.abs(monthlyGain).toLocaleString('en-IN')} (${monthlyReturn.toFixed(2)}%) since last statement.`
    };
  }
}
