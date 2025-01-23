import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { triggerConfetti } from "@/utils/confetti";

interface EmailSubscriptionFormProps {
  onSuccessfulSubscribe: () => void;
}

export const EmailSubscriptionForm = ({ onSuccessfulSubscribe }: EmailSubscriptionFormProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from("email_subscriptions")
      .insert([{ email }]);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit email. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Thank you!",
      description: "You'll receive updates about our latest features.",
    });
    triggerConfetti();
    setEmail("");
    onSuccessfulSubscribe();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
      <Input
        type="email"
        placeholder="Enter your email for updates"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-white text-black placeholder:text-gray-500 border border-border"
      />
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSubmitting ? "Sending..." : "Send"}
      </Button>
    </form>
  );
};