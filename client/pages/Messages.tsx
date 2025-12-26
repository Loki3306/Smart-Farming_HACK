import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChatDialog } from '@/components/chat/ChatDialog';

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the previous page from location state, default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    // If accessed directly via URL, redirect to dashboard
    // The ChatDialog will be opened from other pages via state
    if (!location.state || !(location.state as any)?.openChat) {
      navigate(from, { replace: true });
    }
  }, [navigate, from, location.state]);

  return (
    <ChatDialog 
      open={true} 
      onOpenChange={(open) => {
        if (!open) {
          navigate(from);
        }
      }} 
    />
  );
}
