
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppContent } from "./components/layout/AppContent";
import { FirebaseAuthProvider } from "./providers/FirebaseAuthProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FloatingThemeToggle } from "./components/ui/floating-theme-toggle";
import { clearSupabaseData } from "./lib/clearSupabaseData";
import "./index.css";

function App() {
  useEffect(() => {
    // Clear any Supabase data on app load
    clearSupabaseData();
  }, []);
  
  return (
    <div className="min-h-screen text-foreground">
      <ThemeProvider>
        <FirebaseAuthProvider>
          <Router>
            <AppContent />
            <FloatingThemeToggle />
          </Router>
        </FirebaseAuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
