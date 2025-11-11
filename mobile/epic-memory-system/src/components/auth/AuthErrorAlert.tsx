import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthErrorAlertProps {
  error: string;
}

export const AuthErrorAlert = ({ error }: AuthErrorAlertProps) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};