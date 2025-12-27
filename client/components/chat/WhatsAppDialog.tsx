import { MessageCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserName: string;
  onConfirm: () => void;
}

export function WhatsAppDialog({
  open,
  onOpenChange,
  otherUserName,
  onConfirm,
}: WhatsAppDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Continue on WhatsApp?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Would you like to continue your conversation with <strong>{otherUserName}</strong> on WhatsApp?
            <br /><br />
            This will open WhatsApp and start a chat with them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-green-500 hover:bg-green-600"
          >
            Open WhatsApp
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
