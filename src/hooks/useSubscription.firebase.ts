import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase/config";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, query, where, getDocs } from "firebase/firestore";

export const useSubscription = () => {
  const [loadingStates, setLoadingStates] = useState({
    personalized: false
  });
  const { toast } = useToast();
  const functions = getFunctions();

  const handleSubscription = async (type: 'personalized') => {
    try {
      console.log(`Starting subscription process...`);
      setLoadingStates(prev => ({ ...prev, [type]: true }));

      // Store current location for return after checkout
      localStorage.setItem('checkout-return-url', window.location.pathname);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

      // Get the ID token for authentication
      const idToken = await currentUser.getIdToken();

      // Get the price from Firebase
      const pricesRef = collection(db, 'prices');
      const priceQuery = query(pricesRef, where('__name__', '==', 'price_1QjidsC3HTLX6YIcMQZNNZjb'));
      const priceSnapshot = await getDocs(priceQuery);

      if (priceSnapshot.empty) {
        console.error("Could not find subscription price");
        toast({
          title: "Error: Subscription Not Found",
          description: "No pricing information was found. Please try again later.",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

      const price = { id: priceSnapshot.docs[0].id, ...priceSnapshot.docs[0].data() };

      console.log('Creating checkout session...');
      
      // Call Firebase Function for checkout
      const createCheckout = httpsCallable(functions, 'createCheckout');
      
      try {
        const result = await createCheckout({
          subscriptionType: type,
          priceId: price.id
        });

        const data = result.data as any;
        console.log('create-checkout function response:', data);

        if (!data?.url) {
          console.error('No checkout URL returned from create-checkout', data);
          toast({
            title: "Checkout Error",
            description: "No checkout URL returned. This is likely a configuration issue. Please contact support or try again later.",
            variant: "destructive",
          });
          setLoadingStates(prev => ({ ...prev, [type]: false }));
          return;
        }

        if (typeof data.url !== 'string' || !data.url.startsWith("https://checkout.stripe.com")) {
          console.error('Invalid Stripe checkout URL received:', data.url);
          toast({
            title: "Checkout Error",
            description: "Received an invalid checkout URL from Stripe. Please try again later or contact support.",
            variant: "destructive",
          });
          setLoadingStates(prev => ({ ...prev, [type]: false }));
          return;
        }

        console.log('Redirecting to Stripe checkout:', data.url);

        // Redirect to Stripe checkout in the same tab
        window.location.href = data.url;

      } catch (error: any) {
        console.error('Error from create-checkout:', error);
        toast({
          title: "Checkout Error",
          description: error?.message || "Could not start the checkout process.",
          variant: "destructive",
        });
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        return;
      }

    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  return {
    loadingStates,
    handleSubscription
  };
};