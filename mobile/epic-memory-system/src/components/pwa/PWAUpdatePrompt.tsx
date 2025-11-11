import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { skipWaiting } from '@/lib/pwa/serviceWorkerRegistration';

interface PWAUpdatePromptProps {
  registration: ServiceWorkerRegistration;
  onDismiss: () => void;
}

export function PWAUpdatePrompt({ registration, onDismiss }: PWAUpdatePromptProps) {
  const handleUpdate = () => {
    if (registration.waiting) {
      // Tell the service worker to skip waiting
      skipWaiting();
      // The page will reload automatically when the new service worker takes control
    }
  };

  return (
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-top-5 duration-300">
      <div className="bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              Update Available
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              A new version of Strength.Design is available with improvements and bug fixes
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Update Now
              </Button>
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}