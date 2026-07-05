export class DividendParser {
  static parse(transactions) {
    const dividends = [];
    transactions.forEach(t => {
      if (t.type === 'DIVIDEND') {
        dividends.push({
          isin: t.isin,
          name: t.name,
          date: t.date,
          amount: parseFloat(t.amount) || 0
        });
      }
    });
    return dividends;
  }
}
