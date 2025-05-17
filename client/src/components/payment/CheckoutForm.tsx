import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export default function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      toast({
        title: 'Error',
        description: 'Stripe is still loading. Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      // For testing purposes: you can use a test card number like 4242 4242 4242 4242
      // with any future expiration date, any 3 digits for CVC, and any postal code
      
      // Use confirmPayment with a return URL to handle 3D Secure and other authentication methods
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          // Using if_required for testing instead of always redirecting
          return_url: `${window.location.origin}/payment-success`,
        },
      });
      
      if (error) {
        console.error('Payment confirmation error:', error);
        setErrorMessage(error.message);
        toast({
          title: 'Payment failed',
          description: error.message || 'Payment processing failed',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Handle successful payment without redirect
        console.log('Payment succeeded:', paymentIntent);
        toast({
          title: 'Payment successful!',
          description: 'Your payment was processed successfully.',
        });
        onSuccess(paymentIntent.id);
      } else if (paymentIntent) {
        // Handle other payment intent statuses
        console.log('Payment status:', paymentIntent.status);
        setErrorMessage(`Payment status: ${paymentIntent.status}. Please try again.`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred.');
      toast({
        title: 'Payment error',
        description: 'An unexpected error occurred during payment processing.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || !elements || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}