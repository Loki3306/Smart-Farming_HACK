import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Send,
    Loader,
    Zap,
    RotateCcw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatbot } from '@/hooks/useChatbot';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface EmbeddedChatProps {
    className?: string;
}

export const EmbeddedChat: React.FC<EmbeddedChatProps> = ({ className }) => {
    const { t, i18n } = useTranslation('common');
    const {
        messages,
        isLoading,
        isStreaming,
        error,
        isHealthy,
        sendMessageStream,
        clearMessages,
        checkHealth,
    } = useChatbot();

    const [inputValue, setInputValue] = useState('');
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
        await sendMessageStream(message, i18n.language);
    };

    return (
        <div className={cn("flex flex-col h-full bg-transparent", className)}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-4 opacity-80">
                        <Zap size={28} className="text-emerald-600 mb-2" />
                        <h4 className="font-bold text-emerald-900 mb-1">{t('chatbot.greeting')}</h4>
                        <p className="text-sm text-emerald-800/80 mb-4 px-4 leading-relaxed">
                            {t('chatbot.subtitle')}
                        </p>
                        <div className="w-full max-w-[220px] mx-auto text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                            <p className="text-emerald-700 font-bold mb-2 text-left">{t('chatbot.tryAsking')}</p>
                            <ul className="text-emerald-800/80 space-y-1.5 list-disc list-inside text-left">
                                <li>{t('chatbot.prompts.fertilizer')}</li>
                                <li>{t('chatbot.prompts.price')}</li>
                                <li>{t('chatbot.prompts.weather')}</li>
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
                                        'max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm',
                                        message.role === 'user'
                                            ? 'bg-emerald-600 text-white rounded-br-sm'
                                            : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-emerald-100/50 rounded-bl-sm'
                                    )}
                                >
                                    <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
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
                                <div className="bg-white/60 backdrop-blur-sm border border-emerald-100/50 px-3 py-2 rounded-2xl rounded-bl-sm text-sm flex items-center gap-2 text-emerald-800">
                                    <Loader size={14} className="animate-spin" />
                                    <span>{t('chatbot.thinking')}</span>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-4 mb-2 bg-red-50/90 border border-red-200/50 rounded-lg p-2 text-xs text-red-700 backdrop-blur-sm">
                    <p className="font-semibold">{t('chatbot.error')}: {error}</p>
                </div>
            )}

            {/* Input Area */}
            <form
                onSubmit={handleSendMessage}
                className="p-3 pt-2"
            >
                <div className="relative flex items-center">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('chatbot.placeholder')}
                        disabled={isLoading || isStreaming || !isHealthy}
                        className="text-sm h-11 pr-12 rounded-full border-emerald-200/50 bg-white/60 backdrop-blur-md focus-visible:ring-emerald-500/50 focus-visible:border-emerald-400 placeholder:text-emerald-800/40 shadow-sm"
                        autoFocus
                    />

                    <Button
                        type="submit"
                        disabled={isLoading || isStreaming || !isHealthy || !inputValue.trim()}
                        size="icon"
                        className={cn(
                            "absolute right-1 w-9 h-9 rounded-full transition-all duration-200",
                            inputValue.trim()
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                                : "bg-emerald-200 text-emerald-50"
                        )}
                    >
                        {isStreaming ? (
                            <Loader size={16} className="animate-spin" />
                        ) : (
                            <Send size={16} className={inputValue.trim() ? "ml-0.5" : ""} />
                        )}
                    </Button>
                </div>

                {/* Clear Button */}
                {messages.length > 0 && (
                    <div className="flex justify-center mt-2">
                        <button
                            type="button"
                            className="text-[10px] text-emerald-600/60 hover:text-emerald-700 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full hover:bg-emerald-50/50"
                            onClick={clearMessages}
                            disabled={isLoading || isStreaming}
                        >
                            <RotateCcw size={10} />
                            {t('chatbot.clear')}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};
