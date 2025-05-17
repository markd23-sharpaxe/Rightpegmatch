import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import CheckoutForm from './CheckoutForm';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe with production publishable key
// Make sure to use the publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY, {
  locale: 'en', // Set the locale to English
});

interface StripeCheckoutProps {
  planName: string;
  planDescription: string;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export default function StripeCheckout({ 
  planName, 
  planDescription, 
  clientSecret, 
  onSuccess, 
  onCancel 
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate a small delay to ensure Stripe loads properly
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!clientSecret) {
    return <div>Error: No payment information available.</div>;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0284c7',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{planName} Subscription</CardTitle>
        <CardDescription>{planDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}