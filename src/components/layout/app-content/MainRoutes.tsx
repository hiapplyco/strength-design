import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";

// Lazy load all route components
const LandingPage = lazy(() => import("@/pages/Index"));
const JournalPage = lazy(() => import("@/pages/JournalPage"));
const WorkoutGenerator = lazy(() => import("@/pages/WorkoutGenerator"));
const WorkoutResults = lazy(() => import("@/pages/WorkoutResults"));
const GeneratedWorkouts = lazy(() => import("@/pages/GeneratedWorkouts"));
const DocumentEditor = lazy(() => import("@/pages/DocumentEditor"));
const PublishProgram = lazy(() => import("@/pages/PublishProgram"));
const MovementAnalysisPage = lazy(() => import("@/pages/MovementAnalysisPage"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("@/pages/CheckoutCancel"));
const ProgramChat = lazy(() => import("@/pages/ProgramChat"));
const DesignSystemPlayground = lazy(() => import("@/pages/DesignSystemPlayground"));
const NutritionDiary = lazy(() => import("@/pages/NutritionDiary"));

// Route loading component
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

export const MainRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Redirect old video-analysis route to publish-program */}
        <Route path="/video-analysis" element={<Navigate to="/publish-program" replace />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/workout-generator" element={<WorkoutGenerator />} />
        <Route path="/workout-results" element={<WorkoutResults />} />
        <Route path="/generated-workouts" element={<GeneratedWorkouts />} />
        <Route path="/document-editor" element={<DocumentEditor />} />
        <Route path="/publish-program" element={<PublishProgram />} />
        <Route path="/movement-analysis" element={<MovementAnalysisPage />} />
        <Route path="/nutrition-diary" element={<NutritionDiary />} />
        <Route path="/program-chat" element={<ProgramChat />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout-success" element={<CheckoutSuccess />} />
        <Route path="/checkout-cancel" element={<CheckoutCancel />} />
        <Route path="/design-system" element={<DesignSystemPlayground />} />
      </Routes>
    </Suspense>
  );
};
