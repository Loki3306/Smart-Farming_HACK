import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PostMenuProps {
  isAuthor: boolean;
  hasReported?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onShare?: () => void;
}

export const PostMenu: React.FC<PostMenuProps> = ({
  isAuthor,
  hasReported = false,
  onEdit,
  onDelete,
  onReport,
  onShare,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted rounded-full"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isAuthor ? (
          <>
            {onEdit && (
              <DropdownMenuItem
                onClick={onEdit}
                className="cursor-pointer text-sm gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Post
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-sm gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Post
              </DropdownMenuItem>
            )}
          </>
        ) : (
          <>
            {onShare && (
              <DropdownMenuItem
                onClick={onShare}
                className="cursor-pointer text-sm gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Post
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {hasReported ? (
              <DropdownMenuItem
                disabled
                className="cursor-not-allowed text-sm gap-2 text-orange-600 opacity-70"
              >
                <Flag className="h-4 w-4 fill-orange-600" />
                Reported - Under Review
              </DropdownMenuItem>
            ) : onReport ? (
              <DropdownMenuItem
                onClick={onReport}
                className="cursor-pointer text-sm gap-2 text-orange-600 focus:text-orange-600"
              >
                <Flag className="h-4 w-4" />
                Report Post
              </DropdownMenuItem>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
