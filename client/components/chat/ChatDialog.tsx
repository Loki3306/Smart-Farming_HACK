import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/context/AuthContext';
import { Conversation } from '@/services/chatService';

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatDialog({ open, onOpenChange }: ChatDialogProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { conversations, isLoading, startConversation } = useConversations();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const userId = user?.id || '';

  // Handle conversation ID from URL
  useEffect(() => {
    if (!open) return;
    
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [searchParams, conversations, open]);

  // Handle starting a conversation from URL params
  useEffect(() => {
    if (!open) return;
    
    const farmerId = searchParams.get('farmer_id');
    const expertId = searchParams.get('expert_id');

    if (farmerId && expertId) {
      startConversation(farmerId, expertId)
        .then((conversation) => {
          if (conversation) {
            setSelectedConversation(conversation);
            // Clean up URL params
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('farmer_id');
            newParams.delete('expert_id');
            newParams.set('conversation', conversation.id);
            setSearchParams(newParams);
          }
        })
        .catch((error) => {
          console.error('Failed to start conversation:', error);
        });
    }
  }, [searchParams, startConversation, setSearchParams, open]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('conversation', conversation.id);
    setSearchParams(newParams);
  };

  const handleBack = () => {
    setSelectedConversation(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('conversation');
    setSearchParams(newParams);
  };

  const handleStartNewChat = async (farmerId: string) => {
    if (!userId) return;
    
    try {
      const conversation = await startConversation(userId, farmerId);
      if (conversation) {
        setSelectedConversation(conversation);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('conversation', conversation.id);
        setSearchParams(newParams);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedConversation(null);
    // Clean up URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('conversation');
    newParams.delete('farmer_id');
    newParams.delete('expert_id');
    setSearchParams(newParams);
  };

  // Mobile view: Show either list or chat
  const mobileView = (
    <div className="h-[600px] flex relative">
      <div
        className="absolute inset-0 flex transition-transform duration-300"
        style={{
          width: '200%',
          transform: selectedConversation ? 'translateX(-50%)' : 'translateX(0)',
        }}
      >
        {/* Conversation List */}
        <div className="w-1/2 h-full">
          <ConversationList
            conversations={conversations}
            activeConversationId={selectedConversation?.id || null}
            isLoading={isLoading}
            currentUserId={userId}
            onSelectConversation={handleSelectConversation}
            onStartNewChat={handleStartNewChat}
          />
        </div>

        {/* Chat Window */}
        <div className="w-1/2 h-full">
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBack}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );

  // Desktop view: Split pane
  const desktopView = (
    <div className="h-[600px] flex">
      {/* Left: Conversation List */}
      <div className="w-[380px] border-r flex-shrink-0">
        <ConversationList
          conversations={conversations}
          activeConversationId={selectedConversation?.id || null}
          isLoading={isLoading}
          currentUserId={userId}
          onSelectConversation={handleSelectConversation}
          onStartNewChat={handleStartNewChat}
        />
      </div>

      {/* Right: Chat Window */}
      <div className="flex-1">
        <ChatWindow
          conversation={selectedConversation}
          onBack={handleBack}
          onClose={handleClose}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[600px] p-0 gap-0" onInteractOutside={(e) => e.preventDefault()} hideCloseButton>
        {/* Accessible title for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Messages</DialogTitle>
        </VisuallyHidden>

        {isMobileView ? mobileView : desktopView}
      </DialogContent>
    </Dialog>
  );
}
