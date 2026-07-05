import { PDFReader } from './PDFReader.js';
import { TextExtractor } from './TextExtractor.js';
import { MutualFundParser } from './MutualFundParser.js';
import { StockParser } from './StockParser.js';
import { TransactionParser } from './TransactionParser.js';
import { DematAccountParser } from './DematAccountParser.js';
import { ValidationService } from './ValidationService.js';
import { PortfolioCalculator } from './PortfolioCalculator.js';

export class ImportService {
  static async importStatement(arrayBuffer, password = '') {
    const startTime = Date.now();

    // 1. Read PDF
    const pdf = await PDFReader.read(arrayBuffer, password);

    // 2. Extract Text
    const rawText = await TextExtractor.extract(pdf);

    // 3. Extract Month Key (e.g. May 2026 -> 2026-05)
    const monthKey = extractMonthKey(rawText);

    // 4. Parse Assets
    const lines = rawText.split('\n');
    const mutualFunds = MutualFundParser.parse(lines);
    const stocks = StockParser.parse(lines);
    const transactions = TransactionParser.parse(mutualFunds, stocks);
    const dematAccounts = DematAccountParser.parse(lines);

    // 5. Run Validation
    const validationLogs = ValidationService.validate(mutualFunds, stocks, transactions);

    // 6. Calculate Aggregated Portfolio stats
    const summary = PortfolioCalculator.calculate([...mutualFunds.map(mf => ({
      ...mf,
      type: 'mutualFund'
    })), ...stocks.map(st => ({
      ...st,
      type: 'stock'
    }))]);

    const importTime = Date.now() - startTime;

    return {
      monthKey,
      mutualFunds,
      stocks,
      transactions,
      dematAccounts,
      summary,
      validationLogs,
      importTime,
      totalMFs: mutualFunds.length,
      totalStocks: stocks.length,
      txCount: transactions.length
    };
  }
}

function extractMonthKey(text) {
  // Try to search for month name in CAS statement (e.g. "Consolidated Account Statement for the month of May 2026")
  const match = text.match(/Consolidated Account Statement for the month of\s+([A-Za-z]+)\s+(\d{4})/i) 
             || text.match(/Statement for the period from \d{2}-([A-Za-z]+)-(\d{4})/i);
             
  if (match) {
    const monthName = match[1].toLowerCase();
    const year = match[2];
    const months = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const prefix = months[monthName.slice(0, 3)];
    if (prefix) return `${year}-${prefix}`;
  }

  // Fallback to current year-month
  return new Date().toISOString().slice(0, 7);
}
