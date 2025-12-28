import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Loader,
  AlertCircle,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Zap,
} from 'lucide-react';

// Markdown rendering for AI messages
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useChatbot } from '@/hooks/useChatbot';
import { cn } from '@/lib/utils';

interface ChatbotProps {
  compact?: boolean;
  floating?: boolean;
  onClose?: () => void;
}

/**
 * AI Chatbot Component
 * Provides lightweight AI support for farmers using Ollama
 */
export const Chatbot: React.FC<ChatbotProps> = ({
  compact = false,
  floating = true,
  onClose,
}) => {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    isHealthy,
    healthMessage,
    sendMessage,
    sendMessageStream,
    clearMessages,
    checkHealth,
  } = useChatbot();

  const [isOpen, setIsOpen] = useState(!floating);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Offset from bottom/left in px
  const [offset, setOffset] = useState<{ bottom: number; left: number }>({ bottom: 24, left: 24 });
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartOffset = useRef<{ bottom: number; left: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading || isStreaming || !isHealthy) {
      return;
    }

    const message = inputValue;
    setInputValue('');

    // Use streaming for typing effect
    await sendMessageStream(message);
  };

  if (floating && !isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        drag
        dragElastic={0.2}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onPointerDown={e => {
          dragStartPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={e => {
          if (!dragStartPos.current) return;
          const dx = Math.abs(e.clientX - dragStartPos.current.x);
          const dy = Math.abs(e.clientY - dragStartPos.current.y);
          const moved = Math.sqrt(dx*dx + dy*dy);
          dragStartPos.current = null;
          if (moved < 8) { // threshold in pixels
            setIsOpen(true);
          }
        }}
        className={cn(
          "fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow",
          isDragging && "shadow-2xl cursor-grabbing",
          !isDragging && "cursor-grab"
        )}
        title="Open AI Chatbot"
        style={{ touchAction: 'none' }}
      >
        <MessageCircle size={24} />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {(!floating || isOpen) && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          drag={floating}
          dragElastic={0.2}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          className={cn(
            'flex flex-col border border-green-100 rounded-2xl shadow-xl overflow-hidden',
            'bg-[#f9f9f6]',
            floating ? 'fixed bottom-6 left-6 z-50 cursor-grab active:cursor-grabbing' : 'h-full',
            compact ? 'w-96 h-[500px]' : 'w-full max-w-md h-[600px]',
            isDragging && 'shadow-2xl'
          )}
        >
          {/* Header */}
          <div className="bg-[#3b7a3c] text-white p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              {/* Farmer avatar icon (SVG) */}
              <span className="inline-flex items-center justify-center rounded-full bg-white/20 border border-white/30 w-10 h-10">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="16" cy="24" rx="10" ry="6" fill="#F4D29C"/>
                  <circle cx="16" cy="13" r="6" fill="#F9E4B7" stroke="#B8860B" strokeWidth="1.5"/>
                  <ellipse cx="16" cy="11" rx="6" ry="3" fill="#B8860B" fillOpacity=".15"/>
                  <rect x="10" y="7" width="12" height="4" rx="2" fill="#B8860B"/>
                  <rect x="13" y="3" width="6" height="4" rx="2" fill="#E2B007"/>
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-lg leading-tight">किसान मित्र <span className="font-normal text-base">| Kisaan Mitra</span></h3>
                <div className="text-xs text-white/90 -mt-0.5">आपका खेती सलाहकार</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {floating && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
              )}
              {floating && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Close"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Health Status */}
          {/* No offline state for Hugging Face backend */}

          {isMinimized && floating ? (
            <div className="flex-1" />
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcfcfa] rounded-b-2xl">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <Zap size={40} className="text-green-400 mb-3" />
                    <h4 className="font-bold text-green-700 mb-2">नमस्ते किसान मित्र! | Hello Farmer!</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      खेती या फसल से जुड़ा सवाल पूछें।<br/>
                      Ask your farming or crop question.
                    </p>
                    <div className="mt-4 space-y-1 text-left w-full max-w-xs mx-auto">
                      <p className="text-xs text-green-600 font-bold">झटपट सुझाव / Quick Tips:</p>
                      <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                        <li>🌱 फसल का नाम लिखें (Crop name)</li>
                        <li>🐛 समस्या बताएं (Problem)</li>
                        <li>💸 सस्ता उपाय? (Low-cost?)</li>
                        <li>🗣️ हिंदी/English दोनों चलेगा</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex gap-2',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-xs px-4 py-2 rounded-lg text-sm leading-relaxed',
                            message.role === 'user'
                              ? 'bg-green-500 text-white rounded-br-none'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                          )}
                        >
                          <div className="prose max-w-none whitespace-pre-wrap text-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSanitize]}
                            >
                              {message.message}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {(isLoading || isStreaming) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2"
                      >
                        <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2 text-gray-600">
                          <Loader size={16} className="animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-t border-red-200 p-3 text-sm text-red-700">
                  <p className="font-semibold">Error</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              )}

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-200 p-4 bg-white space-y-2"
              >
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about crops, farming..."
                    disabled={isLoading || isStreaming || !isHealthy}
                    className="text-sm"
                    autoFocus
                  />

                  <Button
                    type="submit"
                    disabled={
                      isLoading || isStreaming || !isHealthy || !inputValue.trim()
                    }
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isStreaming ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </Button>
                </div>

                {/* Clear Button */}
                {messages.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={clearMessages}
                    disabled={isLoading || isStreaming}
                  >
                    <RotateCcw size={14} className="mr-2" />
                    Clear Chat
                  </Button>
                )}

                {/* Help Text */}
                <p className="text-xs text-gray-500 text-center">
                  Powered by Hugging Face AI
                </p>
              </form>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Chatbot;
