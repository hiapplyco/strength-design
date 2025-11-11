
// Re-export the Firebase auth compatibility layer
export { useAuth } from "@/hooks/useSupabaseCompatibility";

// Keep the AuthProvider export for backward compatibility
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // This is now just a pass-through since we're using FirebaseAuthProvider in App.tsx
  return <>{children}</>;
}
