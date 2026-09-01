import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Mic, Square, ShieldAlert, Check, XCircle, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useVoiceOutput } from '../../hooks/useVoiceOutput';

const QUICK_ACTIONS = [
  { label: '📦 Check Stock', query: 'Show me general inventory and stock.' },
  { label: '⚠️ Low Stock', query: 'Which products are low in stock?' },
  { label: '🛒 Pending Orders', query: 'Show pending orders.' },
  { label: '📊 Sales Overview', query: 'What is the sales summary for today?' }
];

const AdminAIPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to the Admin AI Copilot. How can I assist you with store management today?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
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

  const handleSendMessage = async (query = inputValue, confirmedAction = null, isVoice = false) => {
    if (!query.trim() && !confirmedAction) return;

    if (pendingAction && query && !confirmedAction) {
      const lowerQuery = query.toLowerCase().trim();
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
    setPendingAction(null);

    try {
      const historyToSent = updatedMessages
        .filter(m => !m.isSystemStatus)
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
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-lg border border-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner">
            <Sparkles size={24} className="text-indigo-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide">Admin AI Copilot</h2>
            <p className="text-sm text-indigo-200 font-medium">Your intelligent store management assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-indigo-950/40 p-2 rounded-xl border border-indigo-700/50">
          {isSpeaking && (
             <button onClick={stopSpeaking} className="flex items-center space-x-2 text-sm bg-red-500/20 text-red-200 hover:bg-red-500/40 px-3 py-1.5 rounded-lg transition-colors" title="Stop AI Voice">
               <Square size={16} /> <span>Stop Voice</span>
             </button>
          )}
          <button onClick={toggleWakeWord} className="flex items-center space-x-2 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors" title="Toggle 'Hey OneCart' Wake Word">
            {isWakeWordEnabled ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} className="text-slate-400" />}
            <span className={isWakeWordEnabled ? "text-green-100" : "text-slate-300"}>Wake Word</span>
          </button>
          <div className="w-px h-6 bg-indigo-700/50"></div>
          <button onClick={clearChat} className="flex items-center space-x-2 text-sm text-indigo-200 hover:text-white transition-colors hover:bg-white/10 px-3 py-1.5 rounded-lg">
            <Trash2 size={16} /> <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[75%] space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className="flex-shrink-0 mt-1">
                {msg.role === 'user' ? (
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                    <User size={18} />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-indigo-900 rounded-full flex items-center justify-center text-white shadow-md">
                    <Bot size={18} />
                  </div>
                )}
              </div>

              <div className={`flex flex-col space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-4 rounded-2xl shadow-sm text-base
                  ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : msg.isError
                      ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                      : msg.isSystemStatus
                        ? 'bg-slate-200 text-slate-600 italic rounded-tl-sm text-sm'
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
            <div className="flex max-w-[75%] space-x-3">
               <div className="flex-shrink-0 mt-1 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-md">
                  <ShieldAlert size={18} />
               </div>
               <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex flex-col space-y-4 text-base w-full max-w-md">
                  <p className="font-semibold text-lg border-b border-amber-200/50 pb-2">Confirmation Required</p>
                  <p className="text-amber-800">{pendingAction.message}</p>
                  <div className="flex space-x-3 pt-2">
                     <button onClick={handleConfirmAction} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow">
                        <Check size={18} /> <span className="font-medium">Yes, Confirm</span>
                     </button>
                     <button onClick={handleCancelAction} className="flex-1 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all">
                        <XCircle size={18} /> <span className="font-medium">Cancel</span>
                     </button>
                  </div>
               </div>
            </div>
           </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-[80%]">
              <div className="w-10 h-10 bg-indigo-900 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md">
                <Bot size={18} />
              </div>
              <div className="bg-white border border-indigo-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-3 text-base text-slate-500">
                <Loader2 size={20} className="animate-spin text-indigo-600" />
                <span className="font-medium">Admin AI is processing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-6 py-4 bg-white flex flex-wrap gap-3 border-t border-slate-100 shrink-0">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(action.query)}
              className="text-sm font-medium bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-200/50 transition-colors shadow-sm"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center space-x-3 relative max-w-4xl mx-auto"
        >
          <button
             type="button"
             onClick={handleVoiceToggle}
             className={`absolute left-2 top-2 bottom-2 w-12 rounded-xl flex items-center justify-center transition-all z-10
               ${isVoiceModeOn 
                 ? (isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-red-100 text-red-600') 
                 : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
             `}
             title={isVoiceModeOn ? "Turn Voice Mode Off" : "Turn Voice Mode On"}
          >
             <Mic size={22} />
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Listening... Speak your command" : "Ask Admin AI..."}
            className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl pl-16 pr-16 py-4 text-base focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            disabled={isLoading || isListening}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 w-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center transition-colors shadow-md disabled:shadow-none"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
        <div className="max-w-4xl mx-auto text-center mt-3 flex justify-between px-2 items-center">
          <span className="text-xs text-slate-400 font-mono tracking-wider flex items-center">
             <ShieldAlert size={12} className="mr-1" /> AUTHORIZED PERSONNEL ONLY
             {permissionError && <span className="text-red-400 ml-2 border-l border-slate-300 pl-2">Microphone permission denied</span>}
          </span>
          <span className="flex items-center text-xs font-semibold tracking-wide">
             {isSpeaking ? (
                <span className="text-blue-500 flex items-center bg-blue-50 px-2 py-1 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>SPEAKING</span>
             ) : isLoading ? (
                <span className="text-yellow-600 flex items-center bg-yellow-50 px-2 py-1 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>THINKING</span>
             ) : isVoiceModeOn ? (
                <span className="text-red-600 flex items-center bg-red-50 px-2 py-1 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse"></span>LISTENING</span>
             ) : isWakeWordEnabled ? (
                <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-md">Say "Hey OneCart"</span>
             ) : (
                <span className="text-slate-400">Voice Mode Off</span>
             )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminAIPage;
