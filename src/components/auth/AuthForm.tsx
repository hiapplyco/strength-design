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
      view={view}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#D4B96D',
              brandAccent: '#b39b5c',
              inputText: 'black',
              defaultButtonBackground: 'white',
              defaultButtonBackgroundHover: '#f8f8f8',
              defaultButtonBorder: '#e2e8f0',
              defaultButtonText: 'black',
            }
          }
        },
        className: {
          container: 'bg-white text-black',
          label: 'text-black',
          button: 'bg-primary hover:bg-primary/90',
          input: 'bg-white border-gray-300 text-black',
        }
      }}
      providers={[]}
      localization={{
        variables: {
          sign_up: {
            email_label: "Email",
            password_label: "Create Password",
            button_label: "Sign Up",
            link_text: "Already have an account? Sign in",
          },
          sign_in: {
            email_label: "Email",
            password_label: "Password",
            button_label: "Sign In",
            link_text: "Don't have an account? Sign up",
          },
        },
      }}
    />
  );
};