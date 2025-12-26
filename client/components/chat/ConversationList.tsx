import { Search, Loader2, MessageSquarePlus, Users, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConversationItem } from './ConversationItem';
import { ActiveFarmers } from './ActiveFarmers';
import { Conversation, OnlineFarmer } from '@/services/chatService';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  onStartNewChat?: (farmerId: string) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  currentUserId,
  onSelectConversation,
  onStartNewChat,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'farmers'>('conversations');

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFarmerSelect = (farmer: OnlineFarmer) => {
    if (onStartNewChat) {
      onStartNewChat(farmer.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <h2 className="text-xl font-bold mb-4">Messages</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'conversations' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('conversations')}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chats
          </Button>
          <Button
            variant={activeTab === 'farmers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('farmers')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Farmers
          </Button>
        </div>

        {/* Search - only for conversations */}
        {activeTab === 'conversations' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversations' ? (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageSquarePlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'No conversations match your search'
                    : 'Start a conversation with a farmer'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setActiveTab('farmers')}>
                    <Users className="h-4 w-4 mr-2" />
                    Find Farmers
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => onSelectConversation(conversation)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <ActiveFarmers
            currentUserId={currentUserId}
            onSelectFarmer={handleFarmerSelect}
          />
        )}
      </div>
    </div>
  );
}
