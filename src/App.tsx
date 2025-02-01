import { BrowserRouter as Router } from "react-router-dom";
import { AppContent } from "./components/layout/AppContent";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;