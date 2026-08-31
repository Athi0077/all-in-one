import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    setTranscript // allow clearing
  };
};
