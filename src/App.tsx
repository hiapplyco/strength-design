import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WorkoutGenerator from "./pages/WorkoutGenerator";
import DocumentEditor from "./pages/DocumentEditor";
import GeneratedWorkouts from "./pages/GeneratedWorkouts";
import VideoAnalysis from "./pages/VideoAnalysis";
import SharedDocument from "./pages/SharedDocument";
import Pricing from "./pages/Pricing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/workout-generator" element={<WorkoutGenerator />} />
        <Route path="/document-editor" element={<DocumentEditor />} />
        <Route path="/generated-workouts" element={<GeneratedWorkouts />} />
        <Route path="/video-analysis" element={<VideoAnalysis />} />
        <Route path="/shared-document/:id" element={<SharedDocument />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </Router>
  );
}

export default App;