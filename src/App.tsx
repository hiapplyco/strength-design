
import { BrowserRouter as Router } from "react-router-dom";
import { AppContent } from "./components/layout/AppContent";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

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
