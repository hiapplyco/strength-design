import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const next = searchParams.get("next") || "/";
      const type = searchParams.get("type");
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth");
          return;
        }

        // Handle password reset flow
        if (type === "recovery" && session) {
          navigate("/auth/reset-password", { replace: true });
          return;
        }

        navigate(next, { replace: true });
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        navigate("/auth");
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return <LoadingSpinner />;
}