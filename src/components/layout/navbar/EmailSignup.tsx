import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const EmailSignup = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from("lead_gen")
        .insert([{ email }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Thank you for signing up. We'll keep you updated!",
      });
      
      setEmail("");
      setShowEmailInput(false);
    } catch (error: any) {
      console.error("Lead submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return showEmailInput ? (
    <div className="flex items-center gap-2">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-64"
        disabled={isSubmitting}
      />
      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </div>
  ) : (
    <Button onClick={() => setShowEmailInput(true)}>
      Sign Up
    </Button>
  );
};