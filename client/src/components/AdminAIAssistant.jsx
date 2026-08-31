import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, Mic, Square, ShieldAlert, Check, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../services/api';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useVoiceOutput } from '../hooks/useVoiceOutput';

const QUICK_ACTIONS = [
  { label: '📦 Check Stock', query: 'Show me general inventory and stock.' },
  { label: '⚠️ Low Stock', query: 'Which products are low in stock?' },
  { label: '🛒 Pending Orders', query: 'Show pending orders.' },
  { label: '📊 Sales Overview', query: 'What is the sales summary for today?' }
];

const AdminAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // stores actionIntent
  const [isVoiceModeOn, setIsVoiceModeOn] = useState(false);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false);
  const messagesEndRef = useRef(null);

  const { isListening, transcript, permissionError, startListening, stopListening, setTranscript } = useVoiceInput();
  const { isSpeaking, speak, stopSpeaking } = useVoiceOutput();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingAction]);

  useEffect(() => {
    if (!transcript) return;
    const lower = transcript.toLowerCase().trim();

    // 1. Stop Command
    const stopWords = ['stop', 'stop onecart', 'onecart stop', 'stop speaking', 'be quiet'];
    if (stopWords.some(w => lower === w || lower.startsWith(w + ' '))) {
      stopSpeaking();
      setTranscript('');
      return;
    }

    // 2. Wake Word Detection (if voice mode is OFF but wake word is enabled)
    if (!isVoiceModeOn && isWakeWordEnabled) {
      const wakePattern = /^(hey\s*one\s*cart|hi\s*one\s*cart|one\s*cart|hey\s*onecart)\b/i;
      const match = transcript.match(wakePattern);
      if (match) {
        setIsVoiceModeOn(true);
        const command = transcript.replace(wakePattern, '').trim().replace(/^,\s*/, '');
        
        if (command) {
          handleSendMessage(command, null, true);
        } else {
          speak("Yes, how can I help?");
        }
        setTranscript('');
        return;
      }
    }

    // 3. Voice Mode Active Command Processing
    if (isVoiceModeOn) {
      handleSendMessage(transcript, null, true);
      setTranscript('');
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isVoiceModeOn, isWakeWordEnabled, speak, stopSpeaking]);

  const toggleWakeWord = () => {
    if (isWakeWordEnabled) {
      setIsWakeWordEnabled(false);
      setIsVoiceModeOn(false);
      stopListening();
    } else {
      setIsWakeWordEnabled(true);
      startListening();
    }
  };

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Welcome to the Admin AI Copilot. How can I assist you with store management today?'
        }
      ]);
    }
  };

  const handleSendMessage = async (query = inputValue, confirmedAction = null, isVoice = false) => {
    if (!query.trim() && !confirmedAction) return;

    if (pendingAction && query && !confirmedAction) {
      const lowerQuery = query.toLowerCase().trim();
      // Match exact words or starting words to avoid false positives
      const confirmWords = ['yes', 'confirm', 'approve', 'yep', 'yeah', 'sure', 'ok', 'okay', 'do it'];
      const cancelWords = ['no', 'cancel', 'stop', 'reject', 'nope', 'nah'];
      
      const isConfirm = confirmWords.some(w => lowerQuery === w || lowerQuery.startsWith(w + ' '));
      const isCancel = cancelWords.some(w => lowerQuery === w || lowerQuery.startsWith(w + ' '));

      if (isConfirm) {
        setMessages(prev => [...prev, { role: 'user', content: query }]);
        setInputValue('');
        handleSendMessage('', pendingAction, isVoice);
        return;
      }
      
      if (isCancel) {
        setMessages(prev => [...prev, { role: 'user', content: query }, { role: 'assistant', content: 'Action cancelled.', isSystemStatus: true }]);
        setInputValue('');
        setPendingAction(null);
        if (isVoiceModeOn && isSpeaking) stopSpeaking();
        return;
      }
    }

    const userMsg = { role: 'user', content: query };
    const updatedMessages = query ? [...messages, userMsg] : messages;
    
    if (query) {
      setMessages(updatedMessages);
      setInputValue('');
    }
    
    setIsLoading(true);
    setPendingAction(null); // clear any pending action upon new message

    try {
      const historyToSent = updatedMessages
        .filter(m => !m.isSystemStatus) // optionally exclude UI-only messages
        .map(m => ({ role: m.role, content: m.content }));

      const response = await api.post('/admin/ai/chat', { 
        messages: historyToSent,
        confirmedAction 
      });
      
      const { reply, actionIntent } = response.data;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply
        }
      ]);

      if (reply && isVoiceModeOn && isVoice) {
        speak(reply);
      }

      if (actionIntent && actionIntent.type === 'CONFIRM_UPDATE') {
        setPendingAction(actionIntent);
      }

    } catch (error) {
      console.error('Admin AI Chat Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Authorization error or server unreachable. Ensure you are an Admin.', isError: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    setMessages(prev => [...prev, { role: 'user', content: 'Yes, execute that action.' }]);
    handleSendMessage('', pendingAction);
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages(prev => [...prev, { role: 'assistant', content: 'Action cancelled.', isSystemStatus: true }]);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Admin session cleared. How can I help?'
    }]);
    setPendingAction(null);
    stopSpeaking();
  };

  const handleVoiceToggle = () => {
    if (isVoiceModeOn) {
      setIsVoiceModeOn(false);
      if (isListening) stopListening();
      if (isSpeaking) stopSpeaking();
    } else {
      setIsVoiceModeOn(true);
      stopSpeaking();
      startListening();
    }
  };

  return (
    <>
      <button
        onClick={toggleAssistant}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center
          ${isOpen ? 'bg-gray-900 text-white scale-90' : 'bg-indigo-600 text-white hover:scale-110 hover:shadow-indigo-500/30'}
        `}
        title="Admin AI Copilot"
      >
        {isOpen ? <X size={24} /> : <ShieldAlert size={24} />}
      </button>

      <div
        className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[650px] max-h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-2xl border border-indigo-100 flex flex-col z-50 transition-all duration-300 transform origin-bottom-right overflow-hidden
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-8 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ShieldAlert size={20} className="text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Admin AI</h3>
              <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">Internal Copilot</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isSpeaking && (
               <button onClick={stopSpeaking} className="text-xs bg-red-500/20 text-red-200 hover:bg-red-500/40 p-1.5 rounded-full transition-colors" title="Stop AI Voice">
                 <Square size={14} />
               </button>
            )}
            <button onClick={toggleWakeWord} className="text-xs flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors" title="Toggle 'Hey OneCart' Wake Word">
              {isWakeWordEnabled ? <ToggleRight size={14} className="text-green-300" /> : <ToggleLeft size={14} className="text-slate-300" />}
              <span>Wake Word</span>
            </button>
            <button onClick={clearChat} className="text-xs text-indigo-200 hover:text-white transition-colors bg-white/10 px-2 py-1 rounded">
              Clear
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="flex-shrink-0 mt-1">
                  {msg.role === 'user' ? (
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                      <User size={14} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-indigo-900 rounded-full flex items-center justify-center text-white shadow-sm">
                      <Bot size={14} />
                    </div>
                  )}
                </div>

                <div className={`flex flex-col space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm
                    ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : msg.isError
                        ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                        : msg.isSystemStatus
                          ? 'bg-slate-200 text-slate-600 italic rounded-tl-sm text-xs'
                          : 'bg-white border border-indigo-100 text-slate-800 rounded-tl-sm'
                    }
                  `}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pending Action Confirmation */}
          {pendingAction && !isLoading && (
             <div className="flex justify-start">
              <div className="flex max-w-[85%] space-x-2">
                 <div className="flex-shrink-0 mt-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <ShieldAlert size={14} />
                 </div>
                 <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex flex-col space-y-3 text-sm">
                    <p className="font-semibold">{pendingAction.message}</p>
                    <p className="text-xs opacity-80">Do you want to proceed?</p>
                    <div className="flex space-x-2 mt-2">
                       <button onClick={handleConfirmAction} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-1.5 rounded flex items-center justify-center space-x-1 transition-colors">
                          <Check size={14} /> <span>Yes, Confirm</span>
                       </button>
                       <button onClick={handleCancelAction} className="flex-1 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 py-1.5 rounded flex items-center justify-center space-x-1 transition-colors">
                          <XCircle size={14} /> <span>Cancel</span>
                       </button>
                    </div>
                 </div>
              </div>
             </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-2 max-w-[80%]">
                <div className="w-8 h-8 bg-indigo-900 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-indigo-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-2 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span>Admin AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 pt-2 bg-white flex flex-wrap gap-2 border-t border-slate-100">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(action.query)}
                className="text-[11px] font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-indigo-100">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center space-x-2 relative"
          >
            <button
               type="button"
               onClick={handleVoiceToggle}
               className={`absolute left-1.5 top-1.5 bottom-1.5 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10
                 ${isVoiceModeOn 
                   ? (isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-red-100 text-red-600') 
                   : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
               `}
               title={isVoiceModeOn ? "Turn Voice Mode Off" : "Turn Voice Mode On"}
            >
               <Mic size={18} />
            </button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask Admin AI..."}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-12 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
              disabled={isLoading || isListening}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-1.5 top-1.5 bottom-1.5 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Send size={16} className="ml-1" />
            </button>
          </form>
          <div className="text-center mt-2 flex justify-between px-2 items-center">
            <span className="text-[10px] text-slate-400 font-mono flex flex-col items-start">
               <span>AUTHORIZED PERSONNEL ONLY</span>
               {permissionError && <span className="text-red-400">Microphone permission denied</span>}
            </span>
            <span className="flex items-center text-[10px] text-slate-400 font-medium">
               {isSpeaking ? (
                  <span className="text-blue-500 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></span>Speaking...</span>
               ) : isLoading ? (
                  <span className="text-yellow-500 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1 animate-pulse"></span>Thinking...</span>
               ) : isVoiceModeOn ? (
                  <span className="text-red-500 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse"></span>Listening...</span>
               ) : isWakeWordEnabled ? (
                  <span className="text-purple-500">Say "Hey OneCart"</span>
               ) : (
                  <span className="text-slate-400">Voice Mode Off</span>
               )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAIAssistant;
