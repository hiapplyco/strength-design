
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaywallDialog = ({ open, onOpenChange }: PaywallDialogProps) => {
  const { handleSubscription, loadingStates } = useSubscription();

  const handleUpgrade = async () => {
    await handleSubscription('personalized');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            You've used all 3 free workouts. Upgrade to Pro for unlimited workout generation and premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-900">Pro Features</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Unlimited workout generation</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Advanced customization options</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Progress tracking & analytics</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">$25/month</div>
            <div className="text-sm text-gray-600">Cancel anytime</div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button 
              onClick={handleUpgrade}
              disabled={loadingStates.personalized}
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
            >
              {loadingStates.personalized ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
