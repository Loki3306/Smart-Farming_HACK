import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Flag, AlertTriangle } from 'lucide-react';

export type ReportReason = 'spam' | 'inappropriate' | 'misinformation' | 'harassment' | 'other';

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: ReportReason, details: string) => Promise<void>;
  postContent: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'spam',
    label: 'Spam or Advertising',
    description: 'Unwanted promotional content or repetitive posts',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Offensive, vulgar, or unsuitable material',
  },
  {
    value: 'misinformation',
    label: 'False Information',
    description: 'Misleading or incorrect farming advice',
  },
  {
    value: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Targeting or attacking other users',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Something else that violates community guidelines',
  },
];

export const ReportPostDialog: React.FC<ReportPostDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  postContent,
}) => {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason, details.trim());
      onOpenChange(false);
      // Reset form
      setReason('spam');
      setDetails('');
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Flag className="h-5 w-5" />
            Report Post
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe and helpful community. Your report will be reviewed by moderators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Post Preview */}
          <div className="bg-muted p-3 rounded-lg border-l-4 border-orange-400">
            <p className="text-xs text-muted-foreground mb-1">Reporting:</p>
            <p className="text-sm line-clamp-3">
              "{postContent.length > 100 ? postContent.slice(0, 100) + '...' : postContent}"
            </p>
          </div>

          {/* Report Reason */}
          <div className="space-y-3">
            <Label>Why are you reporting this post?</Label>
            <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              {REPORT_REASONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1 cursor-pointer" onClick={() => setReason(option.value)}>
                    <Label
                      htmlFor={option.value}
                      className="font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context about why you're reporting this post..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {details.length} / 500 characters
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-medium mb-1">Please note:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>False reports may result in account restrictions</li>
                <li>Reports are anonymous to the post author</li>
                <li>Posts with 3+ reports will be auto-hidden pending review</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            variant="destructive"
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
