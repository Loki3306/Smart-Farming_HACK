import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  TrendingUp,
  Award,
  MapPin,
  MessageSquare,
  Share2,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Camera,
  X,
  ChevronRight,
  Sparkles,
  Sun,
  Lightbulb,
  Clock,
  Upload,
  Send,
  Loader2,
  BadgeCheck,
  Flame,
  UserCheck,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  useCommunityPosts,
  useCommunityExperts,
  useCommunityStats,
  usePostReactions,
} from "@/hooks/useCommunity";
import type {
  Post as ApiPost,
  Expert as ApiExpert,
  PostType as ApiPostType,
  ReactionType as ApiReactionType,
} from "@/services/communityApi";
import { PostCard } from "@/components/community/PostCard";

// ==================== TYPES ====================

type PostType = ApiPostType;
type ReactionType = ApiReactionType;
type TabType = "posts" | "experts";

interface Post extends Omit<ApiPost, 'reaction_counts' | 'post_type' | 'author_id' | 'image_url' | 'is_trending' | 'has_expert_reply' | 'comment_count'> {
  postType: PostType;
  image?: string;
  reactions: { type: ReactionType; count: number; hasReacted: boolean }[];
  comments: number;
  shares: number;
  timestamp: Date;
  isTrending?: boolean;
  hasExpertReply?: boolean;
}

interface Expert extends Omit<ApiExpert, 'farmer_id' | 'is_verified' | 'last_active_at'> {
  avatar: string;
  isVerified: boolean;
  isActiveThisWeek: boolean;
}

interface TrendingTopic {
  tag: string;
  posts: number;
  heat: "hot" | "warm" | "rising";
}

interface CreatePostData {
  type: PostType | null;
  crop: string;
  content: string;
  method: string;
  image: string | null;
}

// ==================== CONSTANTS ====================

const POST_TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    label: "Success Story",
    emoji: "🌱",
    color: "bg-green-100 text-green-700 border-green-200",
    badgeColor: "bg-green-500",
    description: "Share your farming achievement",
    prompts: {
      crop: "Which crop gave you success?",
      content: "What did you achieve? Tell your story...",
      method: "What method or technique worked?",
    },
  },
  question: {
    icon: HelpCircle,
    label: "Question",
    emoji: "❓",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    badgeColor: "bg-blue-500",
    description: "Ask the community for help",
    prompts: {
      crop: "Which crop is this about?",
      content: "What do you want to know? Be specific...",
      method: "What have you already tried?",
    },
  },
  problem: {
    icon: AlertTriangle,
    label: "Problem",
    emoji: "⚠️",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    badgeColor: "bg-amber-500",
    description: "Report an issue you're facing",
    prompts: {
      crop: "Which crop is affected?",
      content: "Describe the problem in detail...",
      method: "What have you observed?",
    },
  },
  update: {
    icon: Camera,
    label: "Field Update",
    emoji: "📸",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    badgeColor: "bg-purple-500",
    description: "Share what's happening in your field",
    prompts: {
      crop: "What crop are you showing?",
      content: "What's the current situation?",
      method: "Any special technique being used?",
    },
  },
};

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string; countText: string }> = {
  helpful: { emoji: "👍", label: "Helpful", countText: "found helpful" },
  tried: { emoji: "🌱", label: "Tried this", countText: "tried this" },
  didnt_work: { emoji: "⚠️", label: "Didn't work", countText: "said didn't work" },
  new_idea: { emoji: "💡", label: "New idea", countText: "got new ideas" },
};

const CROPS = [
  "Rice", "Wheat", "Cotton", "Sugarcane", "Tomato", "Potato", "Onion",
  "Maize", "Soybean", "Groundnut", "Mustard", "Chilli", "Banana", "Mango",
];

// Transform API post to component post format
const transformPost = (apiPost: ApiPost): Post => ({
  ...apiPost,
  postType: apiPost.post_type,
  image: apiPost.image_url,
  reactions: [
    { type: 'helpful', count: apiPost.reaction_counts?.helpful || 0, hasReacted: false },
    { type: 'tried', count: apiPost.reaction_counts?.tried || 0, hasReacted: false },
    { type: 'new_idea', count: apiPost.reaction_counts?.new_idea || 0, hasReacted: false },
    { type: 'didnt_work', count: apiPost.reaction_counts?.didnt_work || 0, hasReacted: false },
  ],
  comments: apiPost.comment_count || 0,
  shares: 0,
  timestamp: new Date(apiPost.created_at),
  isTrending: apiPost.is_trending,
  hasExpertReply: apiPost.has_expert_reply,
});

// Transform API expert to component expert format
const transformExpert = (apiExpert: ApiExpert): Expert => ({
  ...apiExpert,
  avatar: '',
  isVerified: apiExpert.is_verified,
  isActiveThisWeek: new Date(apiExpert.last_active_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
});

export const Community: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user';
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [createPostStep, setCreatePostStep] = useState<1 | 2>(1);
  const [createPostData, setCreatePostData] = useState<CreatePostData>({
    type: null,
    crop: "",
    content: "",
    method: "",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMascot, setShowMascot] = useState(true);
  const [mascotMessage, setMascotMessage] = useState({
    message: "अपने खेत का अनुभव लिखिए, इससे दूसरे किसानों को मदद मिलेगी।",
    subMessage: "Share your farming experience to help others!",
  });

  const { toast } = useToast();
  
  // Real-time hooks for data fetching
  const {
    posts: apiPosts,
    loading: postsLoading,
    error: postsError,
    hasMore,
    loadMore,
    refresh: refreshPosts,
    createPost: createApiPost,
  } = useCommunityPosts({
    crop: selectedCrop && selectedCrop !== "all" ? selectedCrop : undefined,
    search: searchQuery || undefined,
    limit: 20,
  });
  
  const {
    experts: apiExperts,
    loading: expertsLoading,
    followedExperts,
    toggleFollow,
  } = useCommunityExperts(userId);
  
  const {
    stats,
    trending: trendingTopics,
    loading: statsLoading,
  } = useCommunityStats();
  
  // Transform API data to component format
  const posts = useMemo(() => apiPosts.map(transformPost), [apiPosts]);
  const experts = useMemo(() => apiExperts.map(transformExpert), [apiExperts]);
  
  // Connection status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper Functions
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const getHeatColor = (heat: "hot" | "warm" | "rising"): string => {
    switch (heat) {
      case "hot": return "bg-red-500";
      case "warm": return "bg-orange-400";
      case "rising": return "bg-yellow-400";
      default: return "bg-gray-400";
    }
  };

  // Reset create post state when dialog closes
  useEffect(() => {
    if (!isCreatePostOpen) {
      setCreatePostStep(1);
      setCreatePostData({
        type: null,
        crop: "",
        content: "",
        method: "",
        image: null,
      });
    }
  }, [isCreatePostOpen]);

  // Handle post type selection
  const handlePostTypeSelect = (type: PostType) => {
    setCreatePostData((prev) => ({ ...prev, type }));
    setCreatePostStep(2);
  };

  // Handle post creation - uses real API
  const handleCreatePost = async () => {
    if (!createPostData.type || !createPostData.content) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createApiPost({
        author_id: userId,
        post_type: createPostData.type,
        content: createPostData.content,
        crop: createPostData.crop || undefined,
        method: createPostData.method || undefined,
        image_url: createPostData.image || undefined,
        tags: createPostData.crop ? [createPostData.crop.toLowerCase()] : [],
      });

      if (result) {
        setIsCreatePostOpen(false);
        toast({
          title: "Post shared! 🎉",
          description: "Your experience is now visible to the community.",
        });

        setMascotMessage({
          message: "बहुत बढ़िया! आपकी पोस्ट से दूसरों को मदद मिलेगी।",
          subMessage: "Great job! Your post will help other farmers.",
        });
        setShowMascot(true);
      }
    } catch (error) {
      toast({
        title: "Failed to create post",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reaction - will be connected to usePostReactions hook
  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    try {
      const { reactionsApi } = await import('@/services/communityApi');
      await reactionsApi.toggleReaction(postId, userId, reactionType);
      
      toast({
        title: `${REACTION_CONFIG[reactionType].emoji} ${REACTION_CONFIG[reactionType].label}`,
        description: "Your feedback helps the community!",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to update reaction",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle expert follow
  const handleFollowExpert = async (expertId: string) => {
    try {
      await toggleFollow(expertId);
      const isNowFollowing = !followedExperts.has(expertId);
      toast({
        title: isNowFollowing ? "Following!" : "Unfollowed",
        description: isNowFollowing 
          ? "You'll get updates from this expert." 
          : "You won't receive updates anymore.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to update follow",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-background">
      {/* Connection Status Banner */}
      {!isOnline && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-800">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">You're offline. Some features may not work.</span>
        </div>
      )}
      
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* ==================== HEADER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Users className="w-7 h-7 text-primary" />
              </div>
              Farmer Community
              {isOnline && (
                <span className="ml-2 flex items-center gap-1 text-xs font-normal text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              Learn from fellow farmers and experts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refreshPosts()}
              disabled={postsLoading}
              className="h-10 w-10"
            >
              <RefreshCw className={`w-4 h-4 ${postsLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setIsCreatePostOpen(true)}
              size="lg"
              className="gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Plus className="w-5 h-5" />
              Create Post
            </Button>
          </div>
        </motion.div>

        {/* ==================== SEARCH & FILTER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts, crops, topics, farmers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-12 text-base rounded-xl border-2 focus:border-primary"
            />
          </div>
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl border-2">
              <SelectValue placeholder="Filter by crop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crops</SelectItem>
              {CROPS.map((crop) => (
                <SelectItem key={crop} value={crop}>
                  {crop}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* ==================== TABS ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 border-b border-border"
        >
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-3 font-medium text-base transition-all relative ${
              activeTab === "posts"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Posts
            {activeTab === "posts" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("experts")}
            className={`px-6 py-3 font-medium text-base transition-all relative ${
              activeTab === "experts"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Experts
            {activeTab === "experts" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
        </motion.div>

        {/* ==================== MAIN CONTENT GRID ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {/* POSTS TAB */}
              {activeTab === "posts" && (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Loading State */}
                  {postsLoading && posts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">Loading posts...</p>
                    </div>
                  )}
                  
                  {/* Error State */}
                  {postsError && (
                    <Card className="p-6 bg-red-50 border-red-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="font-medium text-red-800">Failed to load posts</p>
                          <p className="text-sm text-red-600">{postsError}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => refreshPosts()}
                          className="ml-auto"
                        >
                          Retry
                        </Button>
                      </div>
                    </Card>
                  )}
                  
                  {/* Empty State */}
                  {!postsLoading && !postsError && posts.length === 0 && (
                    <Card className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to share your farming experience!
                      </p>
                      <Button onClick={() => setIsCreatePostOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Post
                      </Button>
                    </Card>
                  )}
                  
                  {/* Posts List */}
                  {apiPosts.map((post, index) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onReaction={(postId, reactionType) => handleReaction(postId, reactionType as ApiReactionType)}
                      formatTimeAgo={formatTimeAgo}
                      index={index}
                    />
                  ))}
                  
                  {/* Load More Button */}
                  {hasMore && posts.length > 0 && (
                    <div className="flex justify-center py-4">
                      <Button
                        variant="outline"
                        onClick={() => loadMore()}
                        disabled={postsLoading}
                        className="gap-2"
                      >
                        {postsLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            Load More Posts
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* EXPERTS TAB */}
              {activeTab === "experts" && (
                <motion.div
                  key="experts"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Loading State */}
                  {expertsLoading && experts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">Loading experts...</p>
                    </div>
                  )}
                  
                  {/* Experts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {experts.map((expert, index) => (
                    <motion.div
                      key={expert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                        {/* Active Badge */}
                        {expert.isActiveThisWeek && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 flex items-center gap-2 border-b">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-700">Active this week</span>
                          </div>
                        )}

                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-14 h-14 border-2 border-primary/20">
                              <AvatarImage src={expert.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                {expert.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground truncate">{expert.name}</h3>
                                {expert.isVerified && (
                                  <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{expert.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                <Award className="w-3.5 h-3.5" />
                                <span>{expert.experience} experience</span>
                              </div>
                            </div>
                          </div>

                          {/* Specializations */}
                          <div className="flex flex-wrap gap-2 mt-4">
                            {expert.specializations.map((spec) => (
                              <Badge key={spec} variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {spec}
                              </Badge>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-foreground">
                                {expert.followers.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">Followers</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-foreground">
                                {expert.questionsAnswered.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">Answers</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <Button 
                              variant={followedExperts.has(expert.id) ? "secondary" : "default"} 
                              size="sm" 
                              className="w-full overflow-hidden"
                              onClick={() => handleFollowExpert(expert.id)}
                            >
                              <UserCheck className="w-4 h-4 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{followedExperts.has(expert.id) ? "Following" : "Follow"}</span>
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                              <MessageSquare className="w-4 h-4 mr-1.5" />
                              Ask
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ==================== SIDEBAR ==================== */}
          <div className="space-y-6">
            {/* Daily Farming Brief */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-green-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Daily Farming Brief
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white shadow-sm text-amber-500">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-green-800">Weather Update</p>
                      <p className="text-xs text-green-700/80 mt-0.5">Clear skies expected. Good day for pesticide application.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white shadow-sm text-blue-500">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-green-800">Trending Discussion</p>
                      <p className="text-xs text-green-700/80 mt-0.5">Rabi crop preparation tips getting high engagement</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white shadow-sm text-purple-500">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-green-800">Expert Tip</p>
                      <p className="text-xs text-green-700/80 mt-0.5">Add neem cake to soil before sowing for pest prevention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trending Topics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {trendingTopics.map((topic, index) => (
                    <motion.button
                      key={topic.tag}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between w-full p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-medium w-5">
                          #{index + 1}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${getHeatColor(topic.heat)}`} />
                        <span className="font-medium text-sm text-primary">
                          #{topic.tag}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {topic.posts} posts
                      </span>
                    </motion.button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Community Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    Community Stats
                    {statsLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Active Farmers
                    </span>
                    <span className="font-semibold text-foreground">
                      {stats?.active_farmers?.toLocaleString() || '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Posts Today
                    </span>
                    <span className="font-semibold text-foreground">
                      {stats?.posts_today?.toLocaleString() || '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Questions Answered
                    </span>
                    <span className="font-semibold text-green-600">
                      {stats?.questions_answered_percent ? `${stats.questions_answered_percent}%` : '--'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Ask Expert CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-6 relative">
                  <div className="text-4xl mb-3">🧑‍🔬</div>
                  <h3 className="font-semibold text-lg mb-2">Need Expert Help?</h3>
                  <p className="text-sm opacity-90 mb-4">
                    Get personalized advice from verified agricultural experts in your area.
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full font-medium"
                    onClick={() => setActiveTab("experts")}
                  >
                    Ask an Expert
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Summary Feature Teaser */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-dashed border-2">
                <CardContent className="p-4 text-center">
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">AI Summary</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get quick summaries of long discussions with AI
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* ==================== CREATE POST DIALOG ==================== */}
        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {createPostStep === 1 ? "Create a Post" : "Share Your Experience"}
              </DialogTitle>
              <DialogDescription>
                {createPostStep === 1
                  ? "Help other farmers by sharing what you know"
                  : "Add details to help the community understand better"}
              </DialogDescription>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {/* Step 1: Post Type Selection */}
              {createPostStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-foreground">What would you like to share?</h3>
                    <p className="text-sm text-muted-foreground mt-1">Choose the type of post</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.entries(POST_TYPE_CONFIG) as [PostType, typeof POST_TYPE_CONFIG.success][]).map(
                      ([type, config]) => (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePostTypeSelect(type)}
                          className={`p-6 rounded-xl border-2 ${config.color} hover:shadow-md transition-all text-left`}
                        >
                          <div className="text-3xl mb-3">{config.emoji}</div>
                          <h4 className="font-semibold text-base">{config.label}</h4>
                          <p className="text-xs opacity-80 mt-1">{config.description}</p>
                        </motion.button>
                      )
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Post Content Form */}
              {createPostStep === 2 && createPostData.type && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <button
                      onClick={() => setCreatePostStep(1)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${POST_TYPE_CONFIG[createPostData.type].color}`}>
                      {POST_TYPE_CONFIG[createPostData.type].emoji} {POST_TYPE_CONFIG[createPostData.type].label}
                    </div>
                  </div>

                  {/* Crop Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {POST_TYPE_CONFIG[createPostData.type].prompts.crop}
                    </label>
                    <Select value={createPostData.crop} onValueChange={(v) => setCreatePostData(prev => ({ ...prev, crop: v }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a crop..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CROPS.map((crop) => (
                          <SelectItem key={crop} value={crop}>
                            {crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Main Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {POST_TYPE_CONFIG[createPostData.type].prompts.content}
                    </label>
                    <Textarea
                      value={createPostData.content}
                      onChange={(e) => setCreatePostData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your experience here..."
                      className="min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Be specific and share details that can help other farmers
                    </p>
                  </div>

                  {/* Method/Technique */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {POST_TYPE_CONFIG[createPostData.type].prompts.method} <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Input
                      value={createPostData.method}
                      onChange={(e) => setCreatePostData(prev => ({ ...prev, method: e.target.value }))}
                      placeholder="e.g., Drip irrigation, Organic compost, etc."
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Add a photo <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleCreatePost}
                    disabled={!createPostData.content.trim() || isSubmitting}
                    className="w-full h-12 text-base font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Share with Community
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>

        {/* ==================== FARMER MASCOT ==================== */}
        <AnimatePresence>
          {showMascot && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 max-w-sm"
            >
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl flex-shrink-0">👨‍🌾</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-900">{mascotMessage.message}</p>
                      {mascotMessage.subMessage && (
                        <p className="text-xs text-amber-700 mt-1">{mascotMessage.subMessage}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowMascot(false)}
                      className="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
