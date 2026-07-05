export class DematAccountParser {
  static parse(lines) {
    const dematAccounts = [];

    for (let index = 0; index < lines.length; index++) {
      const cleanLine = lines[index].trim();
      
      const typeMatch = cleanLine.match(/(NSDL|CDSL|CDSI\.)\s*Demat\s*Account/i);
      const isMF = cleanLine.match(/Mutual\s*Fund\s*Folios/i);

      if (typeMatch) {
        const accountType = typeMatch[0].replace(/CDSI\./i, 'CDSL').trim();
        
        // Case 1: Single Line containing all details (e.g. ICICI Bank DP in summary table)
        if (cleanLine.match(/DP\s*ID:|Client\s*ID:|DP\s*Client|DPID:/i)) {
          const dpIdMatch = cleanLine.match(/DP\s*ID\s*:\s*([A-Z0-9]+)/i) || cleanLine.match(/DPID\s*:\s*([A-Z0-9]+)/i);
          const clientIdMatch = cleanLine.match(/Client\s*ID\s*:\s*([A-Z0-9]+)/i) || cleanLine.match(/Client\s*ID\s*([A-Z0-9]+)/i);
          
          let dpId = dpIdMatch ? dpIdMatch[1] : 'N/A';
          let clientId = clientIdMatch ? clientIdMatch[1] : 'N/A';

          let dpName = 'Unknown DP';
          const namePartMatch = cleanLine.match(new RegExp(`${typeMatch[0]}\\s+(.*?)\\s+(DP\\s*ID|DPID|DP\\s*Client)`, 'i'));
          if (namePartMatch) {
            dpName = cleanDPName(namePartMatch[1]);
          }

          let value = 0;
          const numberMatches = cleanLine.match(/\b\d[0-9,.]*\.\d{2}\b/g);
          if (numberMatches && numberMatches.length > 0) {
            let numStr = numberMatches[numberMatches.length - 1].replace(/,/g, '');
            const dots = (numStr.match(/\./g) || []).length;
            if (dots > 1) {
              const parts = numStr.split('.');
              const last = parts.pop();
              numStr = parts.join('') + '.' + last;
            }
            value = parseFloat(numStr);
          }

          // Avoid duplicate accounts
          if (!dematAccounts.some(d => d.clientId === clientId && d.dpId === dpId)) {
            dematAccounts.push({ accountType, dpName, dpId, clientId, currentValue: value });
          }
        } 
        // Case 2: Multi-line layout (details layout)
        else {
          const dpName = lines[index + 1] ? lines[index + 1].trim() : 'Unknown DP';
          const nextNextLine = lines[index + 2] ? lines[index + 2].trim() : '';
          
          if (nextNextLine.match(/DP\s*ID:|Client\s*ID:|DP\s*Client|DPID:/i)) {
            const dpIdMatch = nextNextLine.match(/DP\s*ID\s*:\s*([A-Z0-9]+)/i) || nextNextLine.match(/DPID\s*:\s*([A-Z0-9]+)/i);
            const clientIdMatch = nextNextLine.match(/Client\s*ID\s*:\s*([A-Z0-9]+)/i) || nextNextLine.match(/Client\s*ID\s*([A-Z0-9]+)/i);
            
            let dpId = dpIdMatch ? dpIdMatch[1] : 'N/A';
            let clientId = clientIdMatch ? clientIdMatch[1] : 'N/A';

            let value = 0;
            const valMatchLine = cleanLine + ' ' + nextNextLine;
            const numberMatches = valMatchLine.match(/\b\d[0-9,.]*\.\d{2}\b/g);
            if (numberMatches && numberMatches.length > 0) {
              let numStr = numberMatches[numberMatches.length - 1].replace(/,/g, '');
              const dots = (numStr.match(/\./g) || []).length;
              if (dots > 1) {
                const parts = numStr.split('.');
                const last = parts.pop();
                numStr = parts.join('') + '.' + last;
              }
              value = parseFloat(numStr);
            }

            if (!dematAccounts.some(d => d.clientId === clientId && d.dpId === dpId)) {
              dematAccounts.push({
                accountType,
                dpName: cleanDPName(dpName),
                dpId,
                clientId,
                currentValue: value
              });
            }
          }
        }
      } else if (isMF) {
        let value = 0;
        const numberMatches = cleanLine.match(/\b\d[0-9,.]*\.\d{2}\b/g);
        if (numberMatches && numberMatches.length > 0) {
          let numStr = numberMatches[numberMatches.length - 1].replace(/,/g, '');
          const dotsCount = (numStr.match(/\./g) || []).length;
          if (dotsCount > 1) {
            const parts = numStr.split('.');
            const last = parts.pop();
            numStr = parts.join('') + '.' + last;
          }
          value = parseFloat(numStr);
        }

        if (!dematAccounts.some(d => d.accountType === 'Mutual Fund Folios')) {
          dematAccounts.push({
            accountType: 'Mutual Fund Folios',
            dpName: 'Mutual Fund Registrar',
            dpId: 'N/A',
            clientId: 'N/A',
            currentValue: value
          });
        }
      }
    }

    return dematAccounts;
  }
}

function cleanDPName(name) {
  return name
    .replace(/GROWW INVEST TECH PRIVATE LIMITED/gi, 'Groww')
    .replace(/ZERODHA BROKING LIMITED/gi, 'Zerodha')
    .replace(/ANGEL ONE LIMITED/gi, 'Angel One')
    .replace(/ICICI BANK LIMITED/gi, 'ICICI Direct')
    .replace(/INDSTOCKS PRIVATE LIMITED/gi, 'Indmoney')
    .replace(/[^a-zA-Z0-9\s()&.-]/g, '')
    .trim();
}
