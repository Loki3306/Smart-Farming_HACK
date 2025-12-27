import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { CallWindow } from './CallWindow';
import { IncomingCall } from './IncomingCall';
import { WhatsAppDialog } from './WhatsAppDialog';
import { useMessages } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useCallManagement } from '@/hooks/useCallManagement';
import { useAuth } from '@/context/AuthContext';
import { Conversation } from '@/services/chatService';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface ChatWindowProps {
  conversation: Conversation | null;
  onBack: () => void;
  onClose?: () => void;
}

export function ChatWindow({ conversation, onBack, onClose }: ChatWindowProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);

  const { 
    messages, 
    isLoading, 
    isSending,
    hasMore,
    sendMessage, 
    deleteMessage,
    loadMore 
  } = useMessages(conversation?.id || null);

  const { isTyping, startTyping, stopTyping } = useTypingIndicator(conversation?.id || null);
  
  const { 
    activeCall, 
    incomingCall, 
    isInCall,
    initiateCall, 
    acceptCall, 
    rejectCall, 
    endCall 
  } = useCallManagement();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Detect if user has scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);

    // Load more messages when scrolling near top
    if (scrollTop < 100 && hasMore && !isLoading) {
      loadMore();
    }
  };

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!conversation?.other_user?.id) return;
    
    await sendMessage(content, conversation.other_user.id, imageUrl);
    setShouldAutoScroll(true);
  };

  const handleVoiceCall = () => {
    if (!conversation?.id || !conversation?.other_user?.id) return;
    initiateCall(conversation.id, conversation.other_user.id, 'voice');
  };

  const handleVideoCall = () => {
    if (!conversation?.id || !conversation?.other_user?.id) return;
    initiateCall(conversation.id, conversation.other_user.id, 'video');
  };

  const handleWhatsApp = () => {
    setShowWhatsAppDialog(true);
  };

  const confirmWhatsApp = async () => {
    if (!conversation?.other_user || !user) return;

    // Fetch other user's phone number
    const { data: otherUserData, error } = await supabase
      .from('farmers')
      .select('phone, name')
      .eq('id', conversation.other_user.id)
      .single();

    if (error || !otherUserData?.phone) {
      alert('Unable to get user\'s WhatsApp number. Please try again later.');
      return;
    }

    // Check if they have any messages in the conversation
    const hasMessages = messages.length > 0;

    let whatsappMessage = '';
    if (!hasMessages) {
      // First time - send introduction
      const firstName = otherUserData.name.split(' ')[0];
      whatsappMessage = `Namaste ${firstName}, myself ${user.fullName}. Greetings! We got your contact from Krushi Unnati.`;
    } else {
      // Already talked - just redirect, add system message in our app
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        receiver_id: conversation.other_user.id,
        content: '📱 Conversation shifted to WhatsApp',
        message_type: 'system'
      });
    }

    // Open WhatsApp
    const phoneNumber = otherUserData.phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ''}`;
    window.open(whatsappUrl, '_blank');

    setShowWhatsAppDialog(false);
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/20">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-xl mb-2">No conversation selected</h3>
        <p className="text-muted-foreground">
          Select a conversation from the list to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Active Call Window */}
      {activeCall && (
        <CallWindow
          callId={activeCall.id}
          callType={activeCall.call_type}
          isCaller={activeCall.caller_id === user?.id}
          otherUserId={conversation.other_user?.id || ''}
          otherUserName={conversation.other_user?.name || 'Unknown User'}
          onEnd={endCall}
        />
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCall
          callerName={conversation.other_user?.name || 'Unknown User'}
          callType={incomingCall.call_type}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Header */}
      <ChatHeader
        userName={conversation.other_user?.name || 'Unknown User'}
        userId={conversation.other_user?.id || ''}
        conversationId={conversation.id}
        onBack={onBack}
        onClose={onClose}
        onVoiceCall={handleVoiceCall}
        onVideoCall={handleVideoCall}
        onWhatsApp={handleWhatsApp}
      />

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4"
        onScroll={handleScroll}
      >
        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {/* Initial Loading State */}
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                onDelete={deleteMessage}
                senderName={conversation.other_user?.name}
              />
            ))}
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        onTyping={startTyping}
        onStopTyping={stopTyping}
        disabled={isSending}
        placeholder={`Message ${conversation.other_user?.name || 'user'}...`}
      />

      {/* WhatsApp Dialog */}
      <WhatsAppDialog
        open={showWhatsAppDialog}
        onOpenChange={setShowWhatsAppDialog}
        otherUserName={conversation.other_user?.name || 'user'}
        onConfirm={confirmWhatsApp}
      />
    </div>
  );
}
