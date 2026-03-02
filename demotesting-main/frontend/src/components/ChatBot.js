import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat', {
        message: input,
        session_id: sessionId
      });
      
      setSessionId(response.data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-secondary text-secondary-foreground rounded-full border-2 border-black shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition-all z-50 flex items-center justify-center"
        data-testid="chatbot-toggle-button"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-card border-2 border-black shadow-hard-lg z-50 flex flex-col"
            data-testid="chatbot-window"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 border-b-2 border-black">
              <h3 className="font-heading font-bold text-lg">🥇 EventFlow Assistant</h3>
              <p className="text-xs mt-1">Ask me about events!</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm space-y-2">
                  <p className="font-bold">Hi! I can help you with:</p>
                  <ul className="text-left space-y-1">
                    <li>• What events are happening today?</li>
                    <li>• How do I register?</li>
                    <li>• Where is the venue?</li>
                    <li>• Who is the coordinator?</li>
                    <li>• How can I give feedback?</li>
                  </ul>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 border-2 border-black ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'}`}
                  data-testid={`chat-message-${msg.role}`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {loading && (
                <div className="p-3 border-2 border-black bg-muted mr-8">
                  <p className="text-sm">Typing...</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t-2 border-black">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 h-10 border-2 border-black px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  data-testid="chatbot-input"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground border-2 border-black shadow-button hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50"
                  data-testid="chatbot-send-button"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;