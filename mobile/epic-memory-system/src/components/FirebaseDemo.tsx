import { useFirebaseAuth } from '@/providers/FirebaseAuthProvider';
import { useUserProfile } from '@/hooks/firebase/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Sparkles } from 'lucide-react';

export function FirebaseDemo() {
  const { user, loading, signInWithGoogle, logout } = useFirebaseAuth();
  const { profile, hasProAccess } = useUserProfile();

  if (loading) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Firebase Integration
        </h2>
        <Badge variant={user ? "default" : "secondary"}>
          {user ? "Connected" : "Not Connected"}
        </Badge>
      </div>

      {user ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{user.displayName || 'User'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {profile && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Tier:</span> {profile.tier}
              </p>
              <p className="text-sm">
                <span className="font-medium">Free Workouts Used:</span> {profile.freeWorkoutsUsed}/3
              </p>
              <p className="text-sm">
                <span className="font-medium">Pro Access:</span> {hasProAccess ? 'Yes' : 'No'}
              </p>
            </div>
          )}

          <Button 
            onClick={() => logout()} 
            variant="outline" 
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in to test Firebase authentication
          </p>
          <Button 
            onClick={() => signInWithGoogle()} 
            className="w-full"
          >
            Sign in with Google
          </Button>
        </div>
      )}
    </Card>
  );
}