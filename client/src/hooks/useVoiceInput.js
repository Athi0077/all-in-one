import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false); // reflects actual browser state
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false); // intent to listen (for wake word or active voice)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Use continuous mode
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionError(false);
      };

      recognition.onresult = (event) => {
        // In continuous mode, results are appended to event.results
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldListenRef.current = false;
          setPermissionError(true);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Auto-restart if we still intend to listen (Wake Word or continuous voice mode)
        // Chrome stops recognition after silence, so we need to restart it
        if (shouldListenRef.current && !permissionError) {
          try {
            recognition.start();
          } catch (e) {
            // Ignore if already started
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [permissionError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !shouldListenRef.current) {
      setTranscript('');
      shouldListenRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Ignore if already started
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && shouldListenRef.current) {
      shouldListenRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    permissionError,
    startListening,
    stopListening,
    setTranscript // allow clearing
  };
};
