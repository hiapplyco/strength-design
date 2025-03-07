
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [lastCheckedPath, setLastCheckedPath] = useState(location.pathname);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Only check for redirect when the path changes or auth state changes
  useEffect(() => {
    if (!authLoading && !session && location.pathname !== lastCheckedPath) {
      setLastCheckedPath(location.pathname);
      setShouldRedirect(true);
    } else if (session) {
      setShouldRedirect(false);
    }
  }, [session, authLoading, location.pathname, lastCheckedPath]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!session && shouldRedirect) {
    console.log("Redirecting to home from protected route:", location.pathname);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
