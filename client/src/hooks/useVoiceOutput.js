import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceOutput = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const synthRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.speechSynthesis) {
        setIsSupported(false);
      } else {
        synthRef.current = window.speechSynthesis;
      }
    }
  }, []);

  const speak = useCallback((text) => {
    if (!synthRef.current || !isSupported) return;

    synthRef.current.cancel(); // Stop any current speech

    // Clean up text for speech (e.g. remove markdown, emojis)
    const cleanText = text
      .replace(/[\*\_]/g, '') // remove asterisks/underscores for bold/italics
      .replace(/[^\w\s.,?!'$-]/g, '') // remove emojis and weird characters
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Pick a good voice (preferably a natural english one)
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('Speech Synthesis Error:', e);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  }, [isSupported]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return {
    isSpeaking,
    isSupported,
    speak,
    stopSpeaking
  };
};
