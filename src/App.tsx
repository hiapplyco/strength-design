import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "@/components/ui/toaster";
import AppContent from "./components/layout/AppContent";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <AppContent />
            <Toaster />
          </Router>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;