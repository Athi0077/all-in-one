import React, { useState, useEffect, useRef, useContext } from 'react';
import { MessageSquare, X, Send, Bot, User, ShoppingBag, Loader2, Sparkles, Plus, Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CartContext } from '../context/CartContext';
import { getImageUrl } from '../utils/getImageUrl';

// Quick action chips
const QUICK_ACTIONS = [
  { label: '🎁 Find a Gift', query: 'I need a gift recommendation.' },
  { label: '👕 Find Fashion', query: 'Show me fashion items.' },
  { label: '🏠 Home Products', query: 'Show me home products.' },
  { label: '💰 Shop on a Budget', query: 'What can I get under 1000?' },
  { label: '⭐ Best Rated', query: 'Show me the best rated products.' },
  { label: '🔥 Trending', query: 'What are the trending products?' },
];

const AIShoppingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hi there! 👋 I am ShopAI, your personal shopping assistant. How can I help you find the perfect item today?'
        }
      ]);
    }
  };

  const handleSendMessage = async (query = inputValue) => {
    if (!query.trim()) return;

    const userMsg = { role: 'user', content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyToSent = updatedMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await api.post('/ai/chat', { messages: historyToSent });
      const { reply, products, actionIntent, conversation } = response.data;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          products: products || [],
          actionIntent
        }
      ]);

      if (actionIntent && actionIntent.type === 'CHECKOUT') {
        setTimeout(() => navigate('/checkout'), 1500);
      }

    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I am having trouble connecting to the store. Please try again later.', isError: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?'
    }]);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: `✅ Added ${product.name} to your cart!` }
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleAssistant}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center
          ${isOpen ? 'bg-gray-900 text-white scale-90' : 'bg-primary text-white hover:scale-110 hover:shadow-primary/30'}
        `}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-50 transition-all duration-300 transform origin-bottom-right overflow-hidden
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-8 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot size={20} className="text-primary-light" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">ShopAI</h3>
              <p className="text-xs text-gray-300">Premium Shopping Assistant</p>
            </div>
          </div>
          <button onClick={clearChat} className="text-xs text-gray-300 hover:text-white transition-colors bg-white/10 px-2 py-1 rounded">
            Clear
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>

                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  {msg.role === 'user' ? (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-sm">
                      <User size={14} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-sm">
                      <Sparkles size={14} />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm
                    ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : msg.isError
                        ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                    }
                  `}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Render Product Cards if available */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="w-full flex overflow-x-auto space-x-3 pb-2 pt-1 max-w-full hide-scrollbar">
                      {msg.products.map(product => (
                        <div key={product._id} className="flex-shrink-0 w-48 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                          <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-32 object-cover" />
                          <div className="p-3 flex flex-col flex-1">
                            <p className="text-xs font-semibold text-gray-900 truncate mb-1">{product.name}</p>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-sm text-primary">₹{product.price}</span>
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">⭐ {product.rating}</span>
                            </div>
                            <div className="mt-auto flex space-x-2">
                              <button
                                onClick={() => navigate(`/products/${product._id}`)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded-lg transition-colors font-medium text-center"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs py-1.5 rounded-lg transition-colors font-medium flex items-center justify-center"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-2 max-w-[80%]">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <Sparkles size={14} />
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>ShopAI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions (only show if no messages or just greeting) */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 pt-2 bg-white flex flex-wrap gap-2 border-t border-gray-50">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(action.query)}
                className="text-[11px] font-medium bg-gray-50 hover:bg-primary/10 hover:text-primary text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center space-x-2 relative"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (inputValue.trim() && !isLoading) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2.5 top-1.5 bottom-1.5 w-10 h-10 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Send size={16} className="ml-1" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400">Powered by advanced AI. Responses may vary.</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIShoppingAssistant;
