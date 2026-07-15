import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { parseTransactionWithAI } from '../../services/geminiService';

export default function VoiceTransactionModal({ isOpen, onClose, onSave, showToast }) {
  const {
    isSupported,
    isRecording,
    transcript,
    error: speechError,
    isFallbackActive,
    audioBase64,
    mimeType,
    startRecording,
    stopRecording,
    setTranscript
  } = useSpeechRecognition();

  const [step, setStep] = useState('listening'); // 'listening' | 'parsing' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [manualTextInput, setManualTextInput] = useState('');

  // Start recording automatically on mount
  useEffect(() => {
    let timer;
    if (isOpen) {
      setStep('listening');
      setErrorMsg('');
      // Delay start to prevent strict-mode double-start race condition
      timer = setTimeout(() => {
        startRecording();
      }, 300);
    }
    return () => {
      clearTimeout(timer);
      stopRecording();
    };
  }, [isOpen]);

  // Handle native Web Speech API completion
  const handleStopNativeSpeech = async () => {
    stopRecording();
    if (!transcript.trim()) {
      setErrorMsg('No speech detected. Please speak clearly into your microphone.');
      setStep('error');
      return;
    }
    await parseTextTranscript(transcript);
  };

  // Handle Fallback Audio recording completion
  useEffect(() => {
    if (isFallbackActive && !isRecording && audioBase64) {
      parseAudioFile(audioBase64);
    }
  }, [audioBase64, isRecording, isFallbackActive]);

  // Automatically map and save the parsed result directly to Firebase
  const saveParsedResult = async (parsed) => {
    try {
      const type = parsed.transactionType === 'income' ? 'income' : 'expense';
      
      const rowData = {
        type,
        amount: parsed.amount || '',
        date: parsed.date || new Date().toISOString().slice(0, 10),
        category: parsed.category || '',
        paymentMode: type === 'expense' ? (parsed.paymentMethod || 'Amit HDFC Bank') : 'Amit HDFC Bank',
        creditedTo: type === 'income' ? (parsed.paymentMethod || 'Amit HDFC Bank') : 'Amit HDFC Bank',
        vendor: type === 'expense' ? (parsed.entity || '') : '',
        source: type === 'income' ? (parsed.entity || '') : '',
        purpose: type === 'expense' ? (parsed.details || '') : '',
        remark: type === 'income' ? (parsed.details || '') : ''
      };

      if (!rowData.amount || !rowData.category) {
        throw new Error('AI was unable to extract required transaction details (Amount or Category).');
      }

      await onSave(type, rowData);
      showToast('Transaction saved successfully!', 'success');
      onClose();
    } catch (err) {
      console.error('Auto-save failed:', err);
      setErrorMsg(err.message || 'Failed to auto-save transaction.');
      setStep('error');
    }
  };

  // Parse text using Gemini
  const parseTextTranscript = async (text) => {
    setStep('parsing');
    setErrorMsg('');
    try {
      const result = await parseTransactionWithAI(text, false);
      await saveParsedResult(result);
    } catch (err) {
      console.error('Failed to parse transcript:', err);
      setErrorMsg(err.message || 'Failed to extract transaction details from speech.');
      setStep('error');
    }
  };

  // Parse audio using Gemini
  const parseAudioFile = async (base64) => {
    setStep('parsing');
    setErrorMsg('');
    try {
      const result = await parseTransactionWithAI(base64, true, mimeType);
      await saveParsedResult(result);
    } catch (err) {
      console.error('Failed to parse audio file:', err);
      setErrorMsg(err.message || 'Failed to parse audio. Please check your internet connection and try again.');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay" onClick={onClose}>
      <div className="voice-modal-shell" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="voice-modal-header">
          <h3>🎙️ Voice Transaction Input</h3>
          <button className="voice-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Main Content Areas based on Step */}
        <div className="voice-modal-body">
          {step === 'listening' && (
            <div className="voice-step-container">
              <p className="voice-instruction">
                {isFallbackActive
                  ? "Speaking fallback enabled (cloud processing). Say a transaction, then click Stop."
                  : "Say your transaction clearly. Example: 'Spent 450 rupees on dinner at Starbucks using SBI bank today'."}
              </p>

              {/* Pulsing Mic Button */}
              <div className="voice-mic-container">
                <button
                  className={`voice-mic-btn ${isRecording ? 'voice-mic-btn--active' : ''}`}
                  onClick={isRecording ? (isFallbackActive ? stopRecording : handleStopNativeSpeech) : startRecording}
                  title={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                  {isRecording && <span className="voice-pulse-ring"></span>}
                </button>
                <span className="voice-status-text">
                  {isRecording ? "Listening..." : "Tap to speak"}
                </span>
              </div>

              {/* Live Transcript Display */}
              {!isFallbackActive && transcript && (
                <div className="voice-transcript-preview">
                  <span className="voice-transcript-label">Live transcript:</span>
                  <p className="voice-transcript-text">"{transcript}"</p>
                </div>
              )}

              {isFallbackActive && isRecording && (
                <div className="voice-fallback-indicator">
                  <span className="voice-wave-bar"></span>
                  <span className="voice-wave-bar"></span>
                  <span className="voice-wave-bar"></span>
                  <span className="voice-wave-bar"></span>
                </div>
              )}

              {speechError && (
                <div className="voice-error-banner">
                  <AlertCircle size={16} />
                  <span>{speechError}</span>
                </div>
              )}

              {/* Text Fallback Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                <span className="voice-transcript-label" style={{ textAlign: 'center' }}>Or type the transaction directly:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="ft-input"
                    placeholder="e.g. Spent 450 rupees on dinner at Starbucks using SBI Bank today"
                    value={manualTextInput}
                    onChange={e => setManualTextInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="voice-btn-primary"
                    disabled={!manualTextInput.trim()}
                    onClick={() => parseTextTranscript(manualTextInput)}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    Parse
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'parsing' && (
            <div className="voice-step-container voice-loading">
              <Loader2 size={48} className="voice-spinner" />
              <h4>Analyzing with AI...</h4>
              <p>Extracting details and formatting your transaction.</p>
              {transcript && <p className="voice-parsed-transcript">"{transcript}"</p>}
            </div>
          )}



          {step === 'error' && (
            <div className="voice-step-container voice-error">
              <AlertCircle size={48} className="voice-error-icon" />
              <h4>Oops! Something went wrong</h4>
              <p className="voice-error-msg">{errorMsg || 'We could not process your voice request.'}</p>
              <button
                className="voice-btn-primary"
                onClick={() => {
                  setTranscript('');
                  setStep('listening');
                }}
              >
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
