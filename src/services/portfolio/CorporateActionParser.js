export class CorporateActionParser {
  static detect(transactions) {
    const actions = [];
    transactions.forEach(t => {
      if (t.type === 'BONUS' || t.type === 'SPLIT' || t.type === 'MERGER') {
        actions.push({
          isin: t.isin,
          name: t.name,
          type: t.type,
          date: t.date,
          ratio: t.notes || '1:1'
        });
      }
    });
    return actions;
  }
}
