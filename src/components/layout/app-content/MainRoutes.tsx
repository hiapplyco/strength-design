
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";
import { AuthRequiredWrapper } from "@/components/auth/AuthRequiredWrapper";

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
const Auth = lazy(() => import("@/pages/Auth"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));

// Simple route loading component
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Protected route wrapper with feature context
const ProtectedFeature = ({ 
  children, 
  featureName, 
  description 
}: { 
  children: React.ReactNode;
  featureName: string;
  description: string;
}) => (
  <AuthRequiredWrapper featureName={featureName} description={description}>
    {children}
  </AuthRequiredWrapper>
);

export const MainRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/design-system" element={<DesignSystemPlayground />} />
        
        {/* Redirect old video-analysis route to publish-program */}
        <Route path="/video-analysis" element={<Navigate to="/publish-program" replace />} />
        
        {/* Protected Feature Routes */}
        <Route 
          path="/workout-generator" 
          element={
            <ProtectedFeature 
              featureName="AI Workout Generator"
              description="Generate personalized workout programs based on your goals, fitness level, and available equipment. Get up to 3 free AI-powered workouts."
            >
              <WorkoutGenerator />
            </ProtectedFeature>
          } 
        />
        
        <Route 
          path="/workout-results" 
          element={
            <ProtectedFeature 
              featureName="Workout Results"
              description="View and customize your generated workout programs with detailed exercise instructions and progression plans."
            >
              <WorkoutResults />
            </ProtectedFeature>
          } 
        />
        
        <Route 
          path="/generated-workouts" 
          element={
            <ProtectedFeature 
              featureName="Workout History"
              description="Access all your previously generated workouts and track your fitness journey over time."
            >
              <GeneratedWorkouts />
            </ProtectedFeature>
          } 
        />
        
        <Route 
          path="/program-chat" 
          element={
            <ProtectedFeature 
              featureName="Program Chat - AI Personal Coach"
              description="Chat with an AI coach that has complete access to your fitness data for personalized advice and guidance."
            >
              <ProgramChat />
            </ProtectedFeature>
          } 
        />
        
        <Route 
          path="/nutrition-diary" 
          element={
            <ProtectedFeature 
              featureName="Nutrition Diary"
              description="Track your daily nutrition with real-time macro calculations and comprehensive food database integration."
            >
              <NutritionDiary />
            </ProtectedFeature>
          } 
        />
        
        <Route 
          path="/journal" 
          element={
            <ProtectedFeature 
              featureName="Smart Journal & Wellness Tracking"
              description="Track your progress with intelligent insights, mood tracking, and personalized wellness recommendations."
            >
              <JournalPage />
            </ProtectedFeature>
          } 
        />
        
        <Route 
          path="/movement-analysis" 
          element={
            <ProtectedFeature 
              featureName="Movement Analysis"
              description="Advanced video analysis for technique improvement and injury prevention using AI-powered motion detection."
            >
              <MovementAnalysisPage />
            </ProtectedFeature>
          } 
        />
        
        <Route 
          path="/publish-program" 
          element={
            <ProtectedFeature 
              featureName="Publish Program - Video Creation"
              description="Create and share professional workout videos with AI-generated scripts and voice narration."
            >
              <PublishProgram />
            </ProtectedFeature>
          } 
        />
        
        <Route 
          path="/document-editor" 
          element={
            <ProtectedFeature 
              featureName="Document Editor"
              description="Edit and format your workout programs with our advanced document editor and sharing capabilities."
            >
              <DocumentEditor />
            </ProtectedFeature>
          } 
        />
        
        {/* Success/Cancel pages don't need auth protection */}
        <Route path="/checkout-success" element={<CheckoutSuccess />} />
        <Route path="/checkout-cancel" element={<CheckoutCancel />} />
      </Routes>
    </Suspense>
  );
};
