import React from 'react';
import { Post } from '@/services/communityApi';
import { POST_TYPE_CONFIG } from '@/constants/community';

interface PostImageCardProps {
  post: Post;
}

export const PostImageCard: React.FC<PostImageCardProps> = ({ post }) => {
  const config = POST_TYPE_CONFIG[post.post_type];

  return (
    <div 
      id="post-image-card"
      className="w-[600px] bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-xl"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
          {post.author?.name?.charAt(0) || '?'}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl text-gray-900">{post.author?.name || 'Anonymous'}</h3>
          <p className="text-gray-600 text-sm">{post.author?.location || 'Unknown location'}</p>
        </div>
        {config && (
          <div className="text-4xl">{config.emoji}</div>
        )}
      </div>

      {/* Post Type Badge */}
      {config && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-sm font-semibold text-gray-700 border-2 border-gray-200">
            {config.emoji} {config.label}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="mb-6">
        <p className="text-gray-800 text-lg leading-relaxed">
          {post.content.length > 300 ? post.content.slice(0, 300) + '...' : post.content}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-3 mb-6">
        {post.crop && (
          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            🌾 {post.crop}
          </span>
        )}
        {post.method && (
          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            ⚙️ {post.method}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="pt-6 border-t-2 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🌱</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Krushi Unnati</p>
              <p className="text-xs text-gray-600">AI-Powered Farming</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">Join the Community</p>
            <p className="text-xs text-gray-500">Smart Farming Platform</p>
          </div>
        </div>
      </div>

      {/* Reactions Summary (if any) */}
      {(post.reaction_counts?.helpful || post.reaction_counts?.tried) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {post.reaction_counts.helpful > 0 && (
              <span>👍 {post.reaction_counts.helpful} helpful</span>
            )}
            {post.reaction_counts.tried > 0 && (
              <span>🌱 {post.reaction_counts.tried} tried this</span>
            )}
            {post.comment_count > 0 && (
              <span>💬 {post.comment_count} comments</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
