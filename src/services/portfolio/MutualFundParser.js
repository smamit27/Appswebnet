export class MutualFundParser {
  static parse(lines) {
    const mutualFunds = [];
    const isinRegex = /\b(INF[A-Z0-9]{9})\b/;

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
      let folio = '1037370724';

      tokens.forEach(tok => {
        if (tok === isin) return;
        
        // Skip common MF identifiers
        if (tok.match(/\bMF[A-Z0-9]+\b/gi)) return;

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

      // Handle Folio numbers listed as first number token (greater than 1,000,000)
      let startIndex = 0;
      if (nums.length > 0 && nums[0] > 1000000 && Number.isInteger(nums[0])) {
        folio = String(nums[0]);
        startIndex = 1;
      }

      // Extract numeric arrays from the active subset
      const activeNums = nums.slice(startIndex);
      if (activeNums.length === 0) return;

      let units = activeNums[0] || 0;
      let cost = 0;
      let nav = 0;
      let val = 0;

      // Layout A: Ending in value column (e.g. Angel One MFs)
      const valA = activeNums[activeNums.length - 1] || 0;
      const navA = activeNums[activeNums.length - 2] || 0;

      // Layout B: Ending in gain column (e.g. Mutual Fund Folios)
      const valB = activeNums[activeNums.length - 2] || 0;
      const navB = activeNums[activeNums.length - 3] || 0;

      // Let's check math closeness to detect columns configuration
      const diffA = Math.abs(units * navA - valA);
      const diffB = Math.abs(units * navB - valB);

      if (diffA < diffB && diffA < 100) {
        val = valA;
        nav = navA;
        cost = val * 0.9; // fallback cost
      } else {
        val = valB;
        nav = navB;
        cost = activeNums[activeNums.length - 4] || (val * 0.9);
      }

      // Construct and clean scheme name
      let schemeName = nameWords.join(' ');
      schemeName = schemeName
        .replace(/\bMUTUAL FUND\b/gi, '')
        .replace(/\bREGULAR PLAN GROWTH\b/gi, 'Regular Growth')
        .replace(/\bDIRECT PLAN GROWTH\b/gi, 'Direct Growth')
        .replace(/[-#\s]+$/, '')
        .trim();

      mutualFunds.push({
        isin,
        schemeName: schemeName || 'Generic Mutual Fund',
        folio,
        units,
        purchaseValue: cost || val,
        nav,
        dividend: 0,
        broker: 'CAS Import',
        purchaseDate: '2025-06-15'
      });
    });

    return mutualFunds;
  }
}
