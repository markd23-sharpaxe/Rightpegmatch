import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Initialize Stripe with production publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY, {
  locale: 'en',
});

export default function PaymentSuccessPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Get query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const paymentIntentId = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');

  // Create payment success mutation
  const paymentSuccessMutation = useMutation({
    mutationFn: async ({
      paymentIntentId,
    }: {
      paymentIntentId: string;
    }) => {
      console.log("Calling payment-success endpoint with paymentIntentId:", paymentIntentId);
      const res = await apiRequest("POST", "/api/payment-success", { paymentIntentId });
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Payment success response:", data);
      setStatus('success');
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription"] });
      toast({
        title: "Subscription successful!",
        description: "Your subscription has been activated successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Payment success mutation error:", error);
      setStatus('error');
      setError(error.message);
      toast({
        title: "Payment processing failed",
        description: "There was a problem activating your subscription.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Check if this is a redirect back from Stripe checkout
    const processPayment = async () => {
      try {
        if (redirectStatus === 'succeeded' && paymentIntentId) {
          console.log("Payment succeeded, processing with paymentIntentId:", paymentIntentId);
          // Process the successful payment
          paymentSuccessMutation.mutate({ paymentIntentId });
        } else if (paymentIntentClientSecret && !redirectStatus) {
          // Try to retrieve payment intent status
          const stripe = await stripePromise;
          if (!stripe) {
            throw new Error("Failed to load Stripe");
          }
          
          console.log("Retrieving payment intent with client secret");
          const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
          
          if (paymentIntent && paymentIntent.status === 'succeeded') {
            console.log("Retrieved successful payment intent:", paymentIntent.id);
            paymentSuccessMutation.mutate({ paymentIntentId: paymentIntent.id });
          } else if (paymentIntent) {
            setStatus('error');
            setError(`Payment status: ${paymentIntent.status}. Please try again.`);
          } else {
            throw new Error("Couldn't retrieve payment information");
          }
        } else if (redirectStatus === 'failed') {
          // Handle payment failure
          setStatus('error');
          setError('Payment failed. Please try again.');
          toast({
            title: "Payment failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
        } else {
          // Invalid state
          setStatus('error');
          setError('Invalid payment state. Please try subscribing again.');
        }
      } catch (err) {
        console.error("Error processing payment:", err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };
    
    processPayment();
  }, [paymentIntentId, paymentIntentClientSecret, redirectStatus]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Processing Payment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive flex items-center justify-center">
              <AlertCircle className="mr-2 h-6 w-6" />
              Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">{error || 'There was a problem processing your payment.'}</p>
            <p className="text-muted-foreground">Please try subscribing again.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/subscription')}>
              Return to Subscription Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-success flex items-center justify-center">
            <CheckCircle2 className="mr-2 h-6 w-6 text-green-500" />
            Payment Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Your subscription has been activated successfully!</p>
          <p className="text-muted-foreground">You can now access all the features included in your subscription plan.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate('/my-jobs')}>
            Go to My Jobs
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}