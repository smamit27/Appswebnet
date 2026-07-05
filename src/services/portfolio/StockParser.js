const ISIN_SYMBOL_MAP = {
  'INE208A01029': 'ASHOKLEY',
  'INE296A01032': 'BAJFINANCE',
  'INE263A01024': 'BEL',
  'INE216A01030': 'BRITANNIA',
  'INE517F01014': 'GPPL',
  'INE009A01021': 'INFY',
  'INE121E01018': 'JSWENERGY',
  'INE498L01015': 'LTF',
  'INE160A01022': 'PNB',
  'INE062A01020': 'SBIN',
  'INE467B01029': 'TCS',
  'INE171A01029': 'FEDERALBNK',
  'INE769A01020': 'AARTIIND',
  'INE423A01024': 'ADANIENT',
  'INE364U01010': 'ADANIGREEN',
  'INE192R01011': 'DMART',
  'INE002A01018': 'RELIANCE',
  'INE040H01021': 'SUZLON'
};

export class StockParser {
  static parse(lines) {
    const stocks = [];
    const isinRegex = /\b(INE[A-Z0-9]{9})\b/;

    lines.forEach((line) => {
      const match = line.match(isinRegex);
      if (!match) return;
      const isin = match[1];

      // Clean the line and split by spaces
      const cleanLine = line.replace(/\s+/g, ' ').trim();
      const tokens = cleanLine.split(' ');

      const nums = [];
      const nameWords = [];
      let foundFirstNum = false;

      tokens.forEach(tok => {
        if (tok === isin) return;
        
        // Skip stock exchanges tickers (e.g. ASHOKLEY.NSE)
        if (tok.match(/\.(NSE|BSE)$/i)) return;

        // Matches numeric tokens (digits, commas, dots)
        if (tok.match(/^\d[0-9,.]*$/)) {
          foundFirstNum = true;
          let numStr = tok.replace(/,/g, '');
          const dots = (numStr.match(/\./g) || []).length;
          if (dots > 1) {
            const parts = numStr.split('.');
            const last = parts.pop();
            numStr = parts.join('') + '.' + last;
          }
          nums.push(parseFloat(numStr));
        } else {
          if (!foundFirstNum) {
            nameWords.push(tok);
          }
        }
      });

      // Construct and clean company name
      let companyName = nameWords.join(' ');
      companyName = companyName
        .replace(/\bEQUITY SHARES OF.*\b/gi, '')
        .replace(/\bEQUITY SHARES.*\b/gi, '')
        .replace(/AFTER SPLIT|AFTER SUB DIVISION|AFTER SUBDIVISION/gi, '')
        .replace(/[-#\s]+$/, '')
        .trim();

      // Determine correct ticker symbol
      let symbol = 'STOCK.NS';
      if (ISIN_SYMBOL_MAP[isin]) {
        symbol = ISIN_SYMBOL_MAP[isin] + '.NS';
      } else {
        const tickerMatch = cleanLine.match(/\b([A-Z0-9_.-]+)\.(?:NSE|BSE)\b/i);
        if (tickerMatch) {
          symbol = tickerMatch[1] + '.NS';
        } else if (nameWords.length > 0) {
          symbol = nameWords[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase() + '.NS';
        }
      }

      let qty = 0;
      let avgPrice = 0;
      let currentPrice = 0;
      let val = 0;

      if (nums.length >= 2) {
        currentPrice = nums[nums.length - 2];
        val = nums[nums.length - 1];
        qty = currentPrice > 0 ? Math.round(val / currentPrice) : 0;
        if (qty === 0 && nums.length >= 3) {
          qty = nums[1];
        }
        avgPrice = currentPrice * 0.95;
      }

      stocks.push({
        isin,
        company: companyName || 'Generic Stock',
        symbol,
        quantity: qty,
        averagePrice: avgPrice,
        currentPrice: currentPrice,
        dematAccount: 'IN303028-12345678',
        broker: 'CAS Import'
      });
    });

    return stocks;
  }
}
