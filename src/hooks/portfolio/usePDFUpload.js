import { useState } from 'react';
import { usePortfolioContext } from '../../context/PortfolioContext.jsx';
import { ImportService } from '../../services/portfolio/ImportService.js';
import { FirestoreService } from '../../services/portfolio/FirestoreService.js';

export function usePDFUpload(isAuthorized, user) {
  const { triggerReload } = usePortfolioContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const upload = async (file, password = '', forceMode = null) => {
    setLoading(true);
    setError('');
    try {
      const reader = new FileReader();
      const arrayBuffer = await new Promise((resolve, reject) => {
        reader.onload = e => resolve(e.target.result);
        reader.onerror = err => reject(err);
        reader.readAsArrayBuffer(file);
      });

      const parsed = await ImportService.importStatement(arrayBuffer, password);

      // Check if duplicate snapshot exists for the month key
      const isDuplicate = await FirestoreService.checkDuplicateSnapshot(user, parsed.monthKey);

      if (isDuplicate && !forceMode) {
        setDuplicateData({ monthKey: parsed.monthKey, parsed });
        setLoading(false);
        return { duplicate: true, monthKey: parsed.monthKey };
      }

      const mode = forceMode || 'REPLACE';
      await FirestoreService.saveImport(user, parsed.monthKey, parsed, mode);
      setSuccessData(parsed);
      triggerReload();
      return { success: true };
    } catch (err) {
      if (err.message === 'INCORRECT_PASSWORD') {
        setShowPasswordPrompt(true);
        setPendingFile(file);
      } else {
        setError(err.message || 'Import failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    upload,
    loading,
    error,
    successData,
    clearSuccess: () => setSuccessData(null),
    duplicateData,
    clearDuplicate: () => setDuplicateData(null),
    showPasswordPrompt,
    setShowPasswordPrompt,
    pendingFile,
    setPendingFile
  };
}
