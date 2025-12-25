import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Check,
  Share2,
  Download,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import type { Post } from '@/services/communityApi';

interface ShareDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (method: 'whatsapp' | 'copy_link' | 'native_share' | 'download') => Promise<void>;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  post,
  open,
  onOpenChange,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();

  // Generate share URL
  const shareUrl = `${window.location.origin}/community/post/${post.id}`;
  const shareText = `Check out this farming post by ${post.author?.name}:\n\n"${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}"\n\n`;

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      await onShare('copy_link');
      
      toast({
        title: '✓ Link copied!',
        description: 'Share link copied to clipboard',
        duration: 2000,
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = async () => {
    try {
      setSharing(true);
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + shareUrl)}`;
      window.open(whatsappUrl, '_blank');
      await onShare('whatsapp');
      
      toast({
        title: '📱 Opening WhatsApp',
        description: 'Share this post with your contacts',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Failed to share',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  // Native share (mobile)
  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast({
        title: 'Share not supported',
        description: 'Use other share options',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSharing(true);
      await navigator.share({
        title: `Post by ${post.author?.name}`,
        text: shareText,
        url: shareUrl,
      });
      await onShare('native_share');
      
      toast({
        title: '✓ Shared successfully',
        description: 'Post shared via native share',
        duration: 2000,
      });
    } catch (error: any) {
      // User cancelled share - not an error
      if (error.name !== 'AbortError') {
        toast({
          title: 'Failed to share',
          description: 'Please try again',
          variant: 'destructive',
        });
      }
    } finally {
      setSharing(false);
    }
  };

  // Download as image (future feature)
  const handleDownload = async () => {
    try {
      setSharing(true);
      
      // Try to use html2canvas first
      try {
        const { downloadPostAsImage } = await import('@/utils/downloadPost');
        await downloadPostAsImage(post);
        await onShare('download');
        
        toast({
          title: '✅ Downloaded!',
          description: 'Post saved as image to your device',
          duration: 2000,
        });
      } catch (canvasError) {
        // Fallback to simple canvas method
        console.warn('html2canvas failed, using fallback:', canvasError);
        const { downloadPostAsImageFallback } = await import('@/utils/downloadPost');
        await downloadPostAsImageFallback(post);
        await onShare('download');
        
        toast({
          title: '✅ Downloaded!',
          description: 'Post saved as image to your device',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to download post:', error);
      toast({
        title: 'Download failed',
        description: 'Please try again or use other share options',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Share Post
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Share this farming tip with other farmers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 sm:space-y-3 pb-2">
          {/* WhatsApp Share */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWhatsAppShare}
            disabled={sharing}
            className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2 hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-green-500 flex items-center justify-center text-white">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-foreground text-xs sm:text-sm">WhatsApp</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Share with contacts</p>
            </div>
          </motion.button>

          {/* Copy Link */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-foreground text-xs sm:text-sm">
                {copied ? 'Copied!' : 'Copy Link'}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                localhost:5000/...
              </p>
            </div>
          </motion.button>

          {/* Native Share (Mobile) */}
          {navigator.share && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNativeShare}
              disabled={sharing}
              className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-foreground text-xs sm:text-sm">More Options</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Share via apps</p>
              </div>
            </motion.button>
          )}

          {/* Download as Image */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={sharing}
            className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2 hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-purple-500 flex items-center justify-center text-white">
              {sharing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-foreground text-xs sm:text-sm">
                {sharing ? 'Generating...' : 'Download Image'}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {sharing ? 'Please wait' : 'Save as PNG'}
              </p>
            </div>
          </motion.button>
        </div>

        <div className="pt-2 sm:pt-3 border-t mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-9 text-xs sm:text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
