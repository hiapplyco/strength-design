import { BrowserRouter as Router } from "react-router-dom";
import { AppContent } from "./components/layout/AppContent";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;