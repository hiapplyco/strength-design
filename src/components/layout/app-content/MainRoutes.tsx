import { Routes, Route } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { Dashboard } from "@/pages/Dashboard";
import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";
import JournalPage from "@/pages/JournalPage";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/video-analysis" element={<VideoAnalysis />} />
        <Route path="/journal" element={<JournalPage />} />
      </Routes>
    </>
  );
};
