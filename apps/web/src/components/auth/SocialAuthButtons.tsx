import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone } from 'lucide-react';
import { PhoneAuthModal } from './PhoneAuthModal';
import { cn } from '@/lib/utils';

interface SocialAuthButtonsProps {
  redirectTo?: string;
}

export function SocialAuthButtons({ redirectTo }: SocialAuthButtonsProps) {
  const { toast } = useToast();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoadingProvider('google');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          title: 'Authentication Error',
          description: 'Failed to sign in with Google. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Authentication Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const handlePhoneAuth = () => {
    setPhoneModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/40" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loadingProvider !== null}
          className={cn(
            "w-full h-11 relative group",
            "bg-background hover:bg-accent",
            "border-2 hover:border-primary/50",
            "transition-all duration-200"
          )}
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span className="font-medium">Continue with Google</span>
        </Button>

        <Button
          variant="outline"
          onClick={handlePhoneAuth}
          disabled={loadingProvider !== null}
          className={cn(
            "w-full h-11 relative group",
            "bg-background hover:bg-accent",
            "border-2 hover:border-primary/50",
            "transition-all duration-200"
          )}
        >
          <Phone className="mr-2 h-4 w-4 text-primary" />
          <span className="font-medium">Continue with Phone</span>
        </Button>
      </div>
      
      <PhoneAuthModal 
        open={phoneModalOpen} 
        onOpenChange={setPhoneModalOpen}
        onSuccess={() => {
          if (redirectTo && redirectTo !== '/') {
            window.location.href = redirectTo;
          }
        }}
      />
    </div>
  );
}