
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppContent } from "./components/layout/AppContent";
import { FirebaseAuthProvider } from "./providers/FirebaseAuthProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FloatingThemeToggle } from "./components/ui/floating-theme-toggle";
import { clearSupabaseData } from "./lib/clearSupabaseData";
import { PWAInstallPrompt } from "./components/pwa/PWAInstallPrompt";
import { PWAUpdatePrompt } from "./components/pwa/PWAUpdatePrompt";
import * as serviceWorkerRegistration from "./lib/pwa/serviceWorkerRegistration";
import { toast } from "sonner";
import "./index.css";

function App() {
  const [updateAvailable, setUpdateAvailable] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Clear any Supabase data on app load
    clearSupabaseData();

    // Register service worker for PWA support
    serviceWorkerRegistration.register({
      onSuccess: () => {
        console.log("PWA: Service worker registered successfully");
      },
      onUpdate: (registration) => {
        console.log("PWA: New update available");
        setUpdateAvailable(registration);
        toast.info("A new version is available!");
      },
      onError: (error) => {
        console.error("PWA: Service worker registration failed", error);
      }
    });
  }, []);
  
  return (
    <div className="min-h-screen text-foreground">
      <ThemeProvider>
        <FirebaseAuthProvider>
          <Router>
            <AppContent />
            <FloatingThemeToggle />
            <PWAInstallPrompt />
            {updateAvailable && (
              <PWAUpdatePrompt 
                registration={updateAvailable}
                onDismiss={() => setUpdateAvailable(null)}
              />
            )}
          </Router>
        </FirebaseAuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
