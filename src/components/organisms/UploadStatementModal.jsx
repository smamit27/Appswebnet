import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function formatMonthFull(yyyyMm) {
  try {
    if (!yyyyMm || typeof yyyyMm !== 'string' || !yyyyMm.includes('-')) return String(yyyyMm || '');
    const [y, m] = yyyyMm.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    if (isNaN(d.getTime())) return yyyyMm;
    return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  } catch (e) {
    return String(yyyyMm || '');
  }
}

export default function UploadStatementModal({ isOpen, onClose, onUploadComplete, initialPerson = 'family' }) {
  const [person, setPerson] = useState(initialPerson);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setPerson(initialPerson);
    }
  }, [isOpen, initialPerson]);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, dateNF: 'dd/mm/yyyy' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

        const [selectedYear, selectedMonthStr] = month.split('-').map(Number);
        let startYear = selectedYear;
        let startMonth = selectedMonthStr - 1;
        if (startMonth === 0) {
          startMonth = 12;
          startYear -= 1;
        }
        const startDateStr = `${startYear}-${String(startMonth).padStart(2, '0')}-25`;
        const endDateStr = `${selectedYear}-${String(selectedMonthStr).padStart(2, '0')}-25`;

        const newInc = [];
        const newExp = [];

        let dateIdx = -1, remarkIdx = -1, wIdx = -1, dIdx = -1;
        let foundHeader = false;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          if (!foundHeader) {
            for (let j = 0; j < row.length; j++) {
              const cell = String(row[j] || '').toLowerCase();
              if (cell.includes('value date') || cell.includes('transaction date')) dateIdx = j;
              if (cell.includes('remark') || cell.includes('particular') || cell.includes('narration')) remarkIdx = j;
              if (cell.includes('withdrawal') || cell.includes('debit')) wIdx = j;
              if (cell.includes('deposit') || cell.includes('credit')) dIdx = j;
            }
            if (dateIdx !== -1 && remarkIdx !== -1 && wIdx !== -1) {
              foundHeader = true;
            }
            continue;
          }

          let dateStr = String(row[dateIdx] || '').trim();
          
          // Fallback: If date is parsed as an Excel serial number
          if (/^\d{5}(\.\d+)?$/.test(dateStr)) {
            const serial = parseFloat(dateStr);
            const dateObj = new Date(Math.round((serial - 25569) * 86400 * 1000));
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0');
              const monthNum = String(dateObj.getMonth() + 1).padStart(2, '0');
              const year = dateObj.getFullYear();
              dateStr = `${day}/${monthNum}/${year}`;
            }
          }

          const remarks = String(row[remarkIdx] || '').trim();
          const withdrawalStr = String(row[wIdx] || '').replace(/,/g, '').trim();
          const depositStr = String(row[dIdx] || '').replace(/,/g, '').trim();

          const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (!match) continue;

          const withdrawal = parseFloat(withdrawalStr) || 0;
          const deposit = parseFloat(depositStr) || 0;

          // Auto-categorization
          let category = '';
          const lowerRemarks = remarks.toLowerCase();
          
          if (lowerRemarks.includes('ach/indian clearing')) {
            category = 'Angel One Mutual fund investment';
          } else if (lowerRemarks.includes('upi/saddam')) {
            category = 'Car cleaner';
          } else if (lowerRemarks.includes('upi/axis max l')) {
            category = 'Term Insurance';
          } else if (lowerRemarks.includes('upi/mygate')) {
            category = 'Society Maintance';
          } else if (lowerRemarks.includes('upi/netflix')) {
            category = 'Netflix';
          } else if (lowerRemarks.includes('nfs/cash wdl')) {
            category = 'Cash Withdrawal';
          } else if (lowerRemarks.includes('upi/airtel')) {
            category = 'Airtel Bill';
          } else if (lowerRemarks.includes('upi/avenue')) {
            category = 'D mart';
          } else if (lowerRemarks.includes('upi/amazon')) {
            category = 'Amazon';
          } else if (lowerRemarks.includes('swiggy') || lowerRemarks.includes('zomato')) {
            category = 'Food Delivery';
          } else if (lowerRemarks.includes('amazon') || lowerRemarks.includes('flipkart')) {
            category = 'Online Shopping';
          } else if (lowerRemarks.includes('dps') || lowerRemarks.includes('publicschool')) {
            category = 'School Fees';
          } else {
            category = deposit > 0 ? 'Bank Deposit' : 'Bank Withdrawal';
          }

          const day = match[1].padStart(2, '0');
          const mm = match[2].padStart(2, '0');
          const year = match[3];
          const txDateStr = `${year}-${mm}-${day}`;
          const formattedDate = `${day}/${mm}/${year}`;
          
          if (txDateStr >= startDateStr && txDateStr <= endDateStr) {
            if (deposit > 0) {
              // Ignore UPI deposits (income) as requested
              if (!lowerRemarks.includes('upi/')) {
                newInc.push({ date: formattedDate, source: remarks.substring(0, 45), amount: deposit, remark: category });
              }
            } else if (withdrawal > 0) {
              newExp.push({ date: formattedDate, vendor: remarks.substring(0, 45), amount: withdrawal, purpose: category });
            }
          }
        }

        if (newInc.length === 0 && newExp.length === 0) {
          alert(`No transactions found for the selected cycle (${startDateStr} to ${endDateStr}). Please check the file or select the correct month.`);
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Fetch existing data to merge
        const recordId = `${person}_${month}`;
        const collectionId = `financeMonthly_${person}`;
        const docRef = doc(db, collectionId, recordId);
        
        let existingInc = [];
        let existingExp = [];
        
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dbData = docSnap.data();
          existingInc = dbData.income || [];
          existingExp = dbData.expenses || [];
        }

        const mergedInc = [...existingInc.filter(i => i.source), ...newInc];
        const mergedExp = [...existingExp.filter(e => e.vendor), ...newExp];

        await setDoc(docRef, { income: mergedInc, expenses: mergedExp }, { merge: true });

        alert(`Successfully imported ${newInc.length} incomes and ${newExp.length} expenses to ${person}'s account for ${formatMonthFull(month)}!`);
        
        onUploadComplete();
        onClose();
      } catch (err) {
        console.error('Upload Error:', err);
        alert('Error: ' + err.message + '\n\nIf it is a permission error, make sure you are signed in. If it is a parse error, check the file format.');
      }
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal__header">
          <h2 className="modal__title">Upload Bank Statement</h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
            Select the month you are uploading for, then choose your bank statement (XLS, XLSX, CSV).
          </p>
          <div className="field">
            <label style={{ fontWeight: 600 }}>Statement Month</label>
            <input 
              type="month" 
              className="finance-register-input" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)} 
            />
          </div>

          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn--secondary" onClick={onClose} disabled={isProcessing}>
              Cancel
            </button>
            <button 
              className="btn btn--primary" 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Select File & Upload'}
            </button>
          </div>

          <input
            type="file"
            accept=".csv, .xls, .xlsx, .tsv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
