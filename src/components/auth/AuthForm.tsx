import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

interface AuthFormProps {
  view: "sign_up" | "sign_in";
}

export const AuthForm = ({ view }: AuthFormProps) => {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#D4B96D',
              brandAccent: '#b39b5c',
            }
          }
        }
      }}
      providers={[]}
      view={view}
      localization={{
        variables: {
          sign_up: {
            email_label: "Email",
            password_label: "Create Password",
            button_label: "Start Free Trial",
            link_text: "Already have an account? Sign in",
          },
          sign_in: {
            email_label: "Email",
            password_label: "Password",
            button_label: "Sign In",
            link_text: "New here? Start your free trial",
          },
        },
      }}
    />
  );
};