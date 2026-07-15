import { useState, useEffect, useRef } from 'react';

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [audioBase64, setAudioBase64] = useState(null);
  const [mimeType, setMimeType] = useState('audio/webm');

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isStartedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Default to Indian English / general English
      recognitionRef.current = rec;
    } else {
      setIsSupported(false);
      setIsFallbackActive(true); // Fallback to MediaRecorder (cloud speech fallback)
    }
  }, []);

  const startRecording = async () => {
    if (isStartedRef.current) return;
    isStartedRef.current = true;
    setError(null);
    setTranscript('');
    setAudioBase64(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !isFallbackActive) {
      try {
        const rec = recognitionRef.current;
        if (!rec) {
          isStartedRef.current = false;
          return;
        }

        rec.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        rec.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          isStartedRef.current = false;
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied.');
            setIsRecording(false);
          } else if (event.error === 'no-speech') {
            // Ignore temporary silence
          } else {
            setError(`Recognition error: ${event.error}. Switching to cloud fallback.`);
            try {
              rec.stop();
            } catch (e) {}
            setIsFallbackActive(true);
            startMediaRecorder();
          }
        };

        rec.onend = () => {
          isStartedRef.current = false;
          setIsRecording(false);
        };

        rec.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start Web Speech API:', err);
        setIsFallbackActive(true);
        startMediaRecorder();
      }
    } else {
      startMediaRecorder();
    }
  };

  const startMediaRecorder = async () => {
    isStartedRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      let preferredMimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/ogg')) {
            preferredMimeType = 'audio/ogg';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            preferredMimeType = 'audio/mp4';
          } else {
            preferredMimeType = 'audio/wav';
          }
        }
      } else {
        throw new Error('MediaRecorder API not supported in this browser.');
      }
      setMimeType(preferredMimeType);

      const recorder = new MediaRecorder(stream, { mimeType: preferredMimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        isStartedRef.current = false;
        const audioBlob = new Blob(audioChunksRef.current, { type: preferredMimeType });
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result.split(',')[1];
          setAudioBase64(base64Data);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      isStartedRef.current = false;
      console.error('Failed to access microphone for recording:', err);
      setError(err.message || 'Microphone permission denied or not available.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    isStartedRef.current = false;
    if (isRecording) {
      if (recognitionRef.current && !isFallbackActive) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
      }
      setIsRecording(false);
    }
  };

  return {
    isSupported: typeof window !== 'undefined' && (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined),
    isRecording,
    transcript,
    error,
    isFallbackActive,
    audioBase64,
    mimeType,
    startRecording,
    stopRecording,
    setTranscript
  };
}
