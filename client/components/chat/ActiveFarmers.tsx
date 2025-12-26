import { useEffect, useState } from 'react';
import { Search, Loader2, User, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { chatService, OnlineFarmer } from '@/services/chatService';
import { cn } from '@/lib/utils';
import { OnlineStatus } from './OnlineStatus';

interface ActiveFarmersProps {
  currentUserId: string;
  onSelectFarmer: (farmer: OnlineFarmer) => void;
}

type FilterType = 'all' | 'online';

export function ActiveFarmers({ currentUserId, onSelectFarmer }: ActiveFarmersProps) {
  const [farmers, setFarmers] = useState<OnlineFarmer[]>([]);
  const [filteredFarmers, setFilteredFarmers] = useState<OnlineFarmer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFarmers();
    // Refresh every 30 seconds to update online status
    const interval = setInterval(loadFarmers, 30000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  useEffect(() => {
    let filtered = farmers.filter((farmer) =>
      farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.phone.includes(searchQuery)
    );
    
    // Apply status filter
    if (filterType === 'online') {
      filtered = filtered.filter((farmer) => farmer.status === 'online');
    }
    
    setFilteredFarmers(filtered);
  }, [searchQuery, farmers, filterType]);

  const loadFarmers = async () => {
    setIsLoading(true);
    try {
      const data = await chatService.getOnlineFarmers(currentUserId);
      setFarmers(data);
      setFilteredFarmers(data);
    } catch (error) {
      console.error('Failed to load farmers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (lastSeen: string, status: string) => {
    if (status === 'online') return 'Online';
    if (status === 'away') return 'Away';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const onlineFarmers = filteredFarmers.filter((f) => f.status === 'online');
  const awayFarmers = filteredFarmers.filter((f) => f.status === 'away');
  const offlineFarmers = filteredFarmers.filter((f) => f.status === 'offline');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search and Filter */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search farmers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="flex-1"
          >
            All Farmers
          </Button>
          <Button
            variant={filterType === 'online' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('online')}
            className="flex-1"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            Online Only
          </Button>
        </div>
      </div>

      {/* Farmers List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {searchQuery ? 'No farmers found' : 'No farmers available'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? 'Try a different search term'
                : 'Check back later to see active farmers'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-4">
            {/* Online Farmers */}
            {onlineFarmers.length > 0 && (
              <div>
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Online ({onlineFarmers.length})
                  </h3>
                </div>
                <div className="space-y-1">
                  {onlineFarmers.map((farmer) => (
                    <button
                      key={farmer.id}
                      onClick={() => onSelectFarmer(farmer)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg",
                        "hover:bg-accent transition-colors cursor-pointer"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={undefined} alt={farmer.name} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {getInitials(farmer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <OnlineStatus status={farmer.status} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate">{farmer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatLastSeen(farmer.last_seen, farmer.status)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Away Farmers */}
            {awayFarmers.length > 0 && (
              <div>
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Away ({awayFarmers.length})
                  </h3>
                </div>
                <div className="space-y-1">
                  {awayFarmers.map((farmer) => (
                    <button
                      key={farmer.id}
                      onClick={() => onSelectFarmer(farmer)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg",
                        "hover:bg-accent transition-colors cursor-pointer"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={undefined} alt={farmer.name} />
                          <AvatarFallback className="bg-yellow-100 text-yellow-700">
                            {getInitials(farmer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <OnlineStatus status={farmer.status} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate">{farmer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatLastSeen(farmer.last_seen, farmer.status)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Farmers */}
            {offlineFarmers.length > 0 && (
              <div>
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Offline ({offlineFarmers.length})
                  </h3>
                </div>
                <div className="space-y-1">
                  {offlineFarmers.map((farmer) => (
                    <button
                      key={farmer.id}
                      onClick={() => onSelectFarmer(farmer)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg",
                        "hover:bg-accent transition-colors cursor-pointer"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={undefined} alt={farmer.name} />
                          <AvatarFallback className="bg-gray-100 text-gray-700">
                            {getInitials(farmer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <OnlineStatus status={farmer.status} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate">{farmer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatLastSeen(farmer.last_seen, farmer.status)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
