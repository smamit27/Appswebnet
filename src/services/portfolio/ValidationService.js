export class ValidationService {
  static validate(mutualFunds, stocks, transactions) {
    const logs = [];
    const isins = new Set();

    mutualFunds.forEach(mf => {
      if (!mf.folio) logs.push(`Warning: Missing folio number for mutual fund ${mf.schemeName}`);
      if (!mf.isin) logs.push(`Error: Missing ISIN code for mutual fund ${mf.schemeName}`);
      if (isins.has(mf.isin)) logs.push(`Warning: Duplicate ISIN code detected: ${mf.isin}`);
      isins.add(mf.isin);
      if (mf.units <= 0) logs.push(`Error: Zero or negative units logged for fund ${mf.schemeName}`);
    });

    stocks.forEach(st => {
      if (!st.symbol) logs.push(`Warning: Missing stock ticker symbol for ${st.company}`);
      if (st.quantity <= 0) logs.push(`Error: Zero or negative quantity registered for stock ${st.company}`);
    });

    return logs;
  }
}
