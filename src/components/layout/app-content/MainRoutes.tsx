
import { Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/Index";
import Dashboard from "@/pages/MoVAPage";
import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";
import JournalPage from "@/pages/JournalPage";
import WorkoutGenerator from "@/pages/WorkoutGenerator";
import WorkoutResults from "@/pages/WorkoutResults";
import GeneratedWorkouts from "@/pages/GeneratedWorkouts";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/video-analysis" element={<VideoAnalysis />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/workout-generator" element={<WorkoutGenerator />} />
        <Route path="/workout-results" element={<WorkoutResults />} />
        <Route path="/generated-workouts" element={<GeneratedWorkouts />} />
      </Routes>
    </>
  );
};
