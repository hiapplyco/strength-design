import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from '@/components/ui/loading-states/LoadingState';
import { Phone, ArrowRight } from 'lucide-react';

interface PhoneAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PhoneAuthModal({ open, onOpenChange, onSuccess }: PhoneAuthModalProps) {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const cleanPhone = getCleanPhoneNumber();
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: cleanPhone,
      });

      if (error) throw error;

      toast({
        title: 'Verification code sent',
        description: `We've sent a 6-digit code to ${phone}`,
      });
      
      setStep('verify');
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
      const cleanPhone = getCleanPhoneNumber();
      
      const { error } = await supabase.auth.verifyOtp({
        phone: cleanPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      toast({
        title: 'Phone verified!',
        description: 'You have successfully signed in.',
      });
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset state
      setStep('phone');
      setPhone('');
      setOtp('');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                disabled={loading}
                className="h-11 text-lg"
              />
              <p className="text-xs text-muted-foreground">
                US phone numbers only (+1)
              </p>
            </div>
            
            <Button 
              onClick={handleSendOTP}
              disabled={loading || phone.replace(/\D/g, '').length !== 11}
              className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
            >
              {loading ? (
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
                disabled={loading}
                className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
              >
                {loading ? (
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
                }}
                disabled={loading}
                className="w-full"
              >
                Use a different number
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}