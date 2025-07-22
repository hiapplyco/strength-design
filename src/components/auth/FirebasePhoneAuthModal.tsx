import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from '@/components/ui/loading-states/LoadingState';
import { Phone, ArrowRight } from 'lucide-react';

interface PhoneAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendCode: (phoneNumber: string) => Promise<boolean>;
  onVerifyCode: (code: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string;
}

// Rate limiting helper
const RATE_LIMIT_KEY = 'phone_auth_attempts';
const MAX_ATTEMPTS = 3;
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  phone: string;
  attempts: number[];
}

export function PhoneAuthModal({ 
  open, 
  onOpenChange, 
  onSendCode,
  onVerifyCode,
  isLoading = false,
  error
}: PhoneAuthModalProps) {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { toast } = useToast();

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Show error if provided
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
    }
  }, [error, toast]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as US phone number (1-XXX-XXX-XXXX)
    if (phoneNumber.length <= 1) return phoneNumber;
    if (phoneNumber.length <= 4) return `1-${phoneNumber.slice(1)}`;
    if (phoneNumber.length <= 7) return `1-${phoneNumber.slice(1, 4)}-${phoneNumber.slice(4)}`;
    return `1-${phoneNumber.slice(1, 4)}-${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const getCleanPhoneNumber = () => {
    // Convert formatted phone to E.164 format (+1XXXXXXXXXX)
    const digits = phone.replace(/\D/g, '');
    return `+${digits}`;
  };

  const checkRateLimit = (phoneNumber: string): { allowed: boolean; remainingTime?: number } => {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      const entries: RateLimitEntry[] = stored ? JSON.parse(stored) : [];
      
      const phoneEntry = entries.find(e => e.phone === phoneNumber);
      if (!phoneEntry) return { allowed: true };
      
      // Remove old attempts
      const now = Date.now();
      phoneEntry.attempts = phoneEntry.attempts.filter(time => now - time < COOLDOWN_MS);
      
      if (phoneEntry.attempts.length >= MAX_ATTEMPTS) {
        const oldestAttempt = Math.min(...phoneEntry.attempts);
        const remainingTime = Math.ceil((oldestAttempt + COOLDOWN_MS - now) / 1000 / 60);
        return { allowed: false, remainingTime };
      }
      
      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  };

  const recordAttempt = (phoneNumber: string) => {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      const entries: RateLimitEntry[] = stored ? JSON.parse(stored) : [];
      
      let phoneEntry = entries.find(e => e.phone === phoneNumber);
      if (!phoneEntry) {
        phoneEntry = { phone: phoneNumber, attempts: [] };
        entries.push(phoneEntry);
      }
      
      phoneEntry.attempts.push(Date.now());
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entries));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleSendOTP = async () => {
    const cleanPhone = getCleanPhoneNumber();
    
    // Check rate limit
    const rateLimit = checkRateLimit(cleanPhone);
    if (!rateLimit.allowed) {
      toast({
        variant: 'destructive',
        title: 'Too many attempts',
        description: `Please wait ${rateLimit.remainingTime} minutes before trying again.`,
      });
      return;
    }
    
    setLoading(true);
    try {
      // Record the attempt
      recordAttempt(cleanPhone);
      
      const success = await onSendCode(cleanPhone);
      
      if (success) {
        toast({
          title: 'Verification code sent',
          description: `We've sent a 6-digit code to ${phone}`,
        });
        
        setStep('verify');
        setResendCountdown(60); // 60 second countdown
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send code',
        description: error.message || 'Please check your phone number and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const success = await onVerifyCode(otp);
      
      if (success) {
        toast({
          title: 'Phone verified!',
          description: 'You have successfully signed in.',
        });
        
        handleOpenChange(false);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message || 'Invalid verification code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('phone');
      setPhone('');
      setOtp('');
      setResendCountdown(0);
    }
    onOpenChange(newOpen);
  };

  const effectiveLoading = loading || isLoading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-border/50">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Phone className="h-5 w-5 text-primary" />
            {step === 'phone' ? 'Sign in with phone' : 'Enter verification code'}
          </DialogTitle>
          <DialogDescription>
            {step === 'phone' 
              ? 'Enter your phone number to receive a verification code'
              : `Enter the 6-digit code sent to ${phone}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="1-555-123-4567"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={14}
                disabled={effectiveLoading}
                className="h-11 text-lg"
              />
              <p className="text-xs text-muted-foreground">
                US phone numbers only (+1)
              </p>
            </div>
            
            <Button 
              onClick={handleSendOTP}
              disabled={effectiveLoading || phone.replace(/\D/g, '').length !== 11}
              className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
            >
              {effectiveLoading ? (
                <LoadingState variant="spinner" size="sm" />
              ) : (
                <>
                  Send verification code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={effectiveLoading}
                className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleVerifyOTP}
                disabled={effectiveLoading || otp.length !== 6}
                className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
              >
                {effectiveLoading ? (
                  <LoadingState variant="spinner" size="sm" />
                ) : (
                  'Verify and sign in'
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setResendCountdown(0);
                }}
                disabled={effectiveLoading}
                className="w-full"
              >
                Use a different number
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleSendOTP}
                disabled={effectiveLoading || resendCountdown > 0}
                className="w-full"
              >
                {resendCountdown > 0 
                  ? `Resend code in ${resendCountdown}s` 
                  : 'Resend verification code'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}