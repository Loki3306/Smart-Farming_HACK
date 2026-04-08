import React, { useState, useRef, useEffect } from 'react';
import './VoiceChat.css';
import { Mic, MicOff, Send, User, Bot, Loader2 } from 'lucide-react';

/* 
 * VoiceChatbot Component
 * Implements "Senior Frontend Developer" requirements:
 * - Mobile First
 * - Glassmorphism
 * - Responsive Flexbox Layout
 */

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export const VoiceChat = () => {
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            text: "Hello! I'm your AI Farm Assistant. Tap the microphone to speak.",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ------------------------------------------------------------------
    // Core Voice Logic (Placeholders as requested)
    // ------------------------------------------------------------------

    const startListening = () => {
        setIsListening(true);
        // Simulate "Listening" state
        console.log("🎤 Microphone activated...");

        // Mocking speech recognition delay for demo
        setTimeout(() => {
            // stopListening("How is my crop moisture?"); // Auto-stop simulation if needed
        }, 5000);
    };

    const stopListening = (recognizedText?: string) => {
        setIsListening(false);
        console.log("🛑 Microphone deactivated.");

        if (recognizedText) {
            handleSendMessage(recognizedText);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // ------------------------------------------------------------------
    // Message Handling
    // ------------------------------------------------------------------

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        // Add User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsProcessing(true);

        // Simulate AI Response Delay
        setTimeout(() => {
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: generateMockResponse(text),
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
            setIsProcessing(false);
        }, 1500);
    };

    const generateMockResponse = (input: string): string => {
        const lower = input.toLowerCase();
        if (lower.includes('moisture')) return "Current soil moisture is 45%. This is optimal for Wheat.";
        if (lower.includes('weather')) return "It's currently 24°C with clear skies. No rain expected today.";
        if (lower.includes('hello')) return "Hi there! How can I help you with your farm today?";
        return "I've logged that note. Anything else you'd like to check?";
    };

    return (
        <div className="voice-chat-container">
            {/* Header (Optional for context) */}
            <div className="p-4 flex items-center justify-between glass-panel mx-4 mt-4 md:hidden">
                <span className="font-bold text-gray-700">Farm AI Assistant</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>

            {/* Main Chat Area */}
            <div className="main-chat-area glass-panel">
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}

                {isProcessing && (
                    <div className="chat-bubble bot flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Fixed Action Bar */}
            <div className="action-bar">
                {/* Desktop/Tablet Text Input (Hidden on tiny screens by CSS) */}
                <div className="input-wrapper hidden md:block w-full max-w-md mr-4">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white/80"
                    />
                </div>

                {/* Microphone Button */}
                <div className="relative">
                    <button
                        className={`mic-button ${isListening ? 'listening' : ''}`}
                        onClick={toggleListening}
                        aria-label={isListening ? "Stop listening" : "Start listening"}
                    >
                        {isListening ? <MicOff /> : <Mic />}
                    </button>
                    <div className="status-indicator">
                        {isListening ? "Listening..." : "Tap to Speak"}
                    </div>
                </div>

                {/* Send Button (for text input) */}
                <button
                    className="md:block hidden p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-green-600 transition-colors"
                    onClick={() => handleSendMessage(inputText)}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
