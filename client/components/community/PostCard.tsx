import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Flame,
  BadgeCheck,
  MapPin,
  Clock,
  MoreHorizontal,
  ImageIcon,
  MessageSquare,
  Share2,
  Bookmark,
  Send,
  Loader2,
} from 'lucide-react';
import type { Post as ApiPost, PostType } from '@/services/communityApi';
import { usePostReactions, usePostComments } from '@/hooks/useCommunity';
import { POST_TYPE_CONFIG, REACTION_CONFIG } from '@/constants/community';
import { useAuth } from '@/context/AuthContext';

interface PostCardProps {
  post: ApiPost;
  onReaction: (postId: string, reactionType: string) => Promise<void>;
  formatTimeAgo: (date: Date) => string;
  index: number;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onReaction,
  formatTimeAgo,
  index,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const auth = useAuth();
  const userId = auth?.user?.id || 'demo-user';
  const config = POST_TYPE_CONFIG[post.post_type as PostType];
  
  const { reactionCounts, userReactions, toggleReaction } = usePostReactions(
    post.id,
    userId,
    {
      helpful: post.reaction_counts?.helpful || 0,
      tried: post.reaction_counts?.tried || 0,
      didnt_work: post.reaction_counts?.didnt_work || 0,
      new_idea: post.reaction_counts?.new_idea || 0,
    }
  );

  const { comments, loading: commentsLoading, addComment } = usePostComments(post.id, userId);

  const topReactions = Object.entries(reactionCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({ type: type as keyof typeof REACTION_CONFIG, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    
    setIsSubmittingComment(true);
    const success = await addComment(commentInput);
    if (success) {
      setCommentInput('');
    }
    setIsSubmittingComment(false);
  };

  return (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
        {/* Trending/Expert Reply Badge */}
        {(post.is_trending || post.has_expert_reply) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 flex items-center gap-3 border-b">
            {post.is_trending && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <Flame className="w-3.5 h-3.5" />
                Trending
              </div>
            )}
            {post.has_expert_reply && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                <BadgeCheck className="w-3.5 h-3.5" />
                Expert replied
              </div>
            )}
          </div>
        )}

        <CardContent className="p-5">
          {/* Author Header */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-11 h-11 border-2 border-primary/20">
              <AvatarImage src={post.author?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {post.author?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">
                  {post.author?.name || 'Anonymous'}
                </span>
                {post.author?.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                <Badge variant="secondary" className={`text-xs ${config?.color || 'bg-gray-100'}`}>
                  {config?.emoji} {config?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{post.author?.location || 'Unknown location'}</span>
                <span className="text-muted-foreground/50">•</span>
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatTimeAgo(new Date(post.created_at))}</span>
              </div>
            </div>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <p className="text-foreground leading-relaxed mb-4 text-[15px]">
            {post.content}
          </p>

          {/* Image Placeholder */}
          {post.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Field Photo</p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.crop && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                🌾 {post.crop}
              </Badge>
            )}
            {post.method && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                ⚙️ {post.method}
              </Badge>
            )}
            {post.tags?.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs hover:bg-primary/10 cursor-pointer transition-colors"
              >
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Reaction Summary */}
          {topReactions.length > 0 && (
            <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <div className="flex -space-x-1">
                {topReactions.map((r) => (
                  <span
                    key={r.type}
                    className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-white"
                  >
                    {REACTION_CONFIG[r.type]?.emoji}
                  </span>
                ))}
              </div>
              <span>
                {topReactions[0].count} farmers {REACTION_CONFIG[topReactions[0].type]?.countText}
              </span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t">
            {/* Reactions */}
            <div className="flex items-center gap-1">
              {Object.entries(REACTION_CONFIG).slice(0, 4).map(([type]) => {
                const reactionType = type as keyof typeof REACTION_CONFIG;
                const count = reactionCounts[reactionType] || 0;
                const hasReacted = userReactions.has(reactionType);
                
                return (
                  <motion.button
                    key={reactionType}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleReaction(reactionType)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                      hasReacted
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{REACTION_CONFIG[reactionType]?.emoji}</span>
                    <span className="font-medium">{count}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Comment & Share */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                {post.comment_count || 0}
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <Share2 className="w-4 h-4 mr-1.5" />
                0
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t space-y-4"
            >
              {/* Add Comment Input */}
              <div className="space-y-2">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {auth?.user?.fullName?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="min-h-[40px] text-sm resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentInput.trim() || isSubmittingComment}
                      className="gap-1"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Post
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {comment.author?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{comment.author?.name}</p>
                          {comment.is_expert_reply && (
                            <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-foreground mt-1 break-words">
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {comment.created_at ? formatTimeAgo(new Date(comment.created_at)) : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
