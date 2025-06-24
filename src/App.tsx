
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppContent } from "./components/layout/AppContent";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FloatingThemeToggle } from "./components/ui/floating-theme-toggle";
import "./index.css";

function App() {
  return (
    <div className="min-h-screen text-foreground">
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
            <FloatingThemeToggle />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
