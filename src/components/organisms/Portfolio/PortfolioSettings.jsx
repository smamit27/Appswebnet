import React, { useState } from 'react';
import { usePDFUpload } from '../../../hooks/portfolio/usePDFUpload.js';
import SectionCard from '../../molecules/SectionCard.jsx';
import ToastNotification from '../../molecules/ToastNotification.jsx';

export default function PortfolioSettings({ isAuthorized, user }) {
  const {
    upload,
    loading,
    error,
    successData,
    clearSuccess,
    duplicateData,
    clearDuplicate,
    showPasswordPrompt,
    setShowPasswordPrompt,
    pendingFile,
    setPendingFile
  } = usePDFUpload(isAuthorized, user);

  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a monthly NSDL CAS PDF statement.', 'error');
      return;
    }
    if (!isAuthorized) {
      showToast('Write access restricted. Authorized accounts only.', 'error');
      return;
    }

    const res = await upload(file, password);
    if (res && res.duplicate) {
      showToast(`Statement month ${res.monthKey} already exists. Action required.`, 'warning');
    } else if (res && res.success) {
      showToast('Statement processed successfully.', 'success');
      setFile(null);
      setPassword('');
    }
  };

  const handleDuplicateAction = async (mode) => {
    if (!duplicateData) return;
    const currentFile = file || pendingFile;
    const currentPassword = password;
    
    const parsedData = duplicateData.parsed;
    clearDuplicate();

    setLoadingProgress(true);
    const res = await upload(currentFile, currentPassword, mode);
    setLoadingProgress(false);

    if (res && res.success) {
      showToast(`Statement month updated successfully (${mode} mode).`, 'success');
      setFile(null);
      setPassword('');
      setPendingFile(null);
    }
  };

  const [loadingProgress, setLoadingProgress] = useState(false);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <SectionCard
        badge="Monthly Statement Importer"
        title="Upload NSDL CAS PDF"
        subtitle="Manage and build historical trends by importing password-protected Consolidated Account Statements."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Main Uploader Form */}
          <form onSubmit={handleImport} style={{ display: 'grid', gap: 16, padding: 20, background: 'rgba(61, 63, 52, 0.03)', borderRadius: 12 }}>
            <div className="field">
              <label htmlFor="cas-pdf-file">Select NSDL CAS Statement (.pdf)</label>
              <input 
                type="file" 
                id="cas-pdf-file" 
                accept=".pdf" 
                onChange={handleFileChange} 
                disabled={loading || loadingProgress} 
                required 
              />
            </div>

            <div className="field">
              <label htmlFor="cas-pdf-password">PDF Decryption Password</label>
              <input 
                type="password" 
                id="cas-pdf-password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter password" 
                disabled={loading || loadingProgress} 
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <button 
                type="submit" 
                className="btn btn--primary" 
                disabled={loading || loadingProgress || !file || !isAuthorized}
              >
                {loading || loadingProgress ? 'Processing Decryption…' : 'Upload and Parse PDF'}
              </button>
            </div>
            {error && <p style={{ color: 'var(--coral)', fontSize: '0.85rem', marginTop: 4 }}>Error: {error}</p>}
          </form>

          {/* Import success Summary */}
          {successData && (
            <div style={{ padding: 20, border: '1px solid var(--teal)', background: '#e6f7ed', borderRadius: 12, display: 'grid', gap: 10 }}>
              <h4 style={{ color: 'var(--pine)', margin: 0 }}>✓ Imported Successfully</h4>
              <p className="sub" style={{ fontSize: '0.82rem', marginBottom: 8 }}>Statement details processed into historical snaps record database:</p>
              
              <div style={{ display: 'grid', gap: 6, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Month Key:</span>
                  <strong>{successData.monthKey}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Mutual Funds:</span>
                  <strong>{successData.totalMFs} schemes</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Stocks:</span>
                  <strong>{successData.totalStocks} companies</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Transactions Logged:</span>
                  <strong>{successData.txCount} entries</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Parsing Elapsed Time:</span>
                  <strong>{successData.importTime} ms</strong>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button className="btn btn--secondary btn--sm" onClick={clearSuccess}>Clear Summary</button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Duplicate Month Confirmation Overlay */}
      {duplicateData && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal__header">
              <h2 className="modal__title" style={{ color: 'var(--amber)' }}>Warning: Duplicate Statement</h2>
            </div>
            <div style={{ padding: '0 20px 20px 20px' }}>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 20 }}>
                A Consolidated Account Statement for the month of <strong>{duplicateData.monthKey}</strong> has already been imported. How would you like to proceed?
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn--secondary" onClick={clearDuplicate}>Cancel</button>
                <button className="btn btn--danger" onClick={() => handleDuplicateAction('REPLACE')}>Replace Existing</button>
                <button className="btn btn--primary" onClick={() => handleDuplicateAction('MERGE')}>Merge</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Prompt modal */}
      {showPasswordPrompt && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__header">
              <h2 className="modal__title">PDF Password Required</h2>
              <button className="modal__close" onClick={() => setShowPasswordPrompt(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding: '0 20px 20px 20px' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>
                The selected NSDL statement PDF is encrypted. Please enter the password to parse:
              </p>
              <div className="field" style={{ marginBottom: 16 }}>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="PDF password" 
                  autoFocus 
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn--secondary" onClick={() => setShowPasswordPrompt(false)}>Cancel</button>
                <button 
                  className="btn btn--primary" 
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    if (pendingFile) upload(pendingFile, password);
                  }}
                >
                  Decrypt PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
