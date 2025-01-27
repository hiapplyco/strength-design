import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Home, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const navigate = useNavigate();
  
  // Add new state for scroll handling
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      
      // Make navbar visible when scrolling up or at the top
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

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

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-border shadow-sm transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Home 
              className="h-6 w-6 text-primary cursor-pointer hover:text-primary/80 transition-colors" 
              onClick={handleHomeClick}
            />
            <span className="text-2xl font-collegiate text-primary tracking-wider">STRENGTH.DESIGN</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/pricing')}
            >
              Pricing
            </Button>
            {showEmailInput ? (
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
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 animate-fade-in">
            <Button
              className="w-full justify-start"
              variant="ghost"
              onClick={() => {
                navigate('/pricing');
                setIsMobileMenuOpen(false);
              }}
            >
              Pricing
            </Button>
            {showEmailInput ? (
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button 
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            ) : (
              <Button
                className="w-full justify-start"
                onClick={() => setShowEmailInput(true)}
              >
                Sign Up
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};