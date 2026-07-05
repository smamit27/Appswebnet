export class TransactionParser {
  static parse(mutualFunds, stocks) {
    const transactions = [];

    mutualFunds.forEach(mf => {
      transactions.push({
        type: 'BUY',
        assetType: 'mutualFund',
        isin: mf.isin,
        name: mf.schemeName,
        date: mf.purchaseDate || '2025-01-15',
        units: mf.units,
        price: mf.purchaseValue / (mf.units || 1),
        amount: mf.purchaseValue
      });
    });

    stocks.forEach(st => {
      transactions.push({
        type: 'BUY',
        assetType: 'stock',
        isin: st.isin,
        name: st.company,
        date: '2025-02-10',
        units: st.quantity,
        price: st.averagePrice,
        amount: st.quantity * st.averagePrice
      });
    });

    return transactions;
  }
}
