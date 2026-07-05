import React from 'react';
import { useCollection } from '../../../hooks/useCollection.js';
import SectionCard from '../../molecules/SectionCard.jsx';
import * as XLSX from 'xlsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

export default function PortfolioReports({ isAuthorized, user }) {
  const holdings = useCollection('holdings', [], user);
  const transactions = useCollection('transactions', [], user);

  const handleExportXLSX = () => {
    if (transactions.items.length === 0) {
      alert('No transactions found to export.');
      return;
    }

    // Format transaction list for spreadsheet
    const data = transactions.items.map(t => ({
      'Date': t.date || 'N/A',
      'Asset Type': t.assetType === 'mutualFund' ? 'Mutual Fund' : 'Stock',
      'Asset Name': t.name || 'N/A',
      'ISIN': t.isin || 'N/A',
      'Transaction Type': t.type || 'N/A',
      'Units/Shares': t.units || 0,
      'Price': t.price || 0,
      'Total Amount (INR)': t.amount || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    
    // Auto-fit column widths
    const maxLens = data.reduce((acc, row) => {
      Object.keys(row).forEach((key, colIdx) => {
        const cellLen = String(row[key]).length;
        acc[colIdx] = Math.max(acc[colIdx] || 10, cellLen, key.length);
      });
      return acc;
    }, []);
    worksheet['!cols'] = maxLens.map(len => ({ wch: len + 3 }));

    XLSX.writeFile(workbook, `NSDL_CAS_Portfolio_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <SectionCard
        badge="Report center"
        title="Downloadable Reports"
        subtitle="Export historical data logs, transaction records, and holdings summaries to Excel formats."
      >
        <div style={{ padding: 24, background: 'rgba(61, 63, 52, 0.03)', borderRadius: 12, display: 'grid', gap: 16, maxWidth: 500 }}>
          <h4>Transaction Ledger Export</h4>
          <p className="sub" style={{ fontSize: '0.82rem' }}>
            Generates a formatted Excel spreadsheet (`.xlsx`) containing all trades, buys, sells, SIP runs, and folio balances parsed from NSDL statements.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn--primary" onClick={handleExportXLSX}>
              📥 Export Transactions (Excel)
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
