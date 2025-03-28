
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    console.log("Redirecting to home from protected route:", location.pathname);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
