import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import type { Post, PostType } from '@/services/communityApi';
import { POST_TYPE_CONFIG } from '@/constants/community';

interface EditPostDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (postId: string, updates: Partial<Post>) => Promise<void>;
}

export const EditPostDialog: React.FC<EditPostDialogProps> = ({
  post,
  open,
  onOpenChange,
  onSave,
}) => {
  const [content, setContent] = useState(post.content);
  const [postType, setPostType] = useState<PostType>(post.post_type as PostType);
  const [crop, setCrop] = useState(post.crop || '');
  const [method, setMethod] = useState(post.method || '');
  const [tags, setTags] = useState((post.tags || []).join(', '));
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const updates: Partial<Post> = {
        content: content.trim(),
        post_type: postType,
        crop: crop.trim() || undefined,
        method: method.trim() || undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      await onSave(post.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Post</DialogTitle>
          <DialogDescription>
            Update your post content and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Post Type */}
          <div className="space-y-2">
            <Label htmlFor="post-type">Post Type</Label>
            <Select value={postType} onValueChange={(value) => setPostType(value as PostType)}>
              <SelectTrigger id="post-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POST_TYPE_CONFIG).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{config.emoji}</span>
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your farming experience..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length} / 1000 characters
            </p>
          </div>

          {/* Crop */}
          <div className="space-y-2">
            <Label htmlFor="crop">Crop (Optional)</Label>
            <Input
              id="crop"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="e.g., Tomato, Wheat, Rice"
            />
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label htmlFor="method">Farming Method (Optional)</Label>
            <Input
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="e.g., Organic, Hydroponic, Traditional"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Separate tags with commas (e.g., irrigation, pestcontrol)"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
