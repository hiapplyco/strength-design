import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { triggerConfetti } from "@/utils/confetti";

interface ContactFormProps {
  subscriptionType: string;
  onSuccess: () => void;
}

export const ContactForm = ({ subscriptionType, onSuccess }: ContactFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("contact_submissions")
      .insert([{ 
        name, 
        email, 
        subscription_type: subscriptionType 
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success!",
      description: "Thank you for your interest. We'll be in touch soon.",
    });
    triggerConfetti();
    setName("");
    setEmail("");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white text-black placeholder:text-gray-400"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white text-black placeholder:text-gray-400"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full"
      >
        Submit
      </Button>
      <p className="text-sm text-center text-gray-600">
        We'll reach out to you shortly to discuss how we can help achieve your fitness goals.
      </p>
    </form>
  );
};