import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { SubscriptionPlan as DbSubscriptionPlan } from "@shared/schema";
import StripeCheckout from "@/components/payment/StripeCheckout";

// Extend the SubscriptionPlan type to include the features field for our UI
interface SubscriptionPlan extends DbSubscriptionPlan {
  features?: string[];
}

// Define the type for user subscription data
interface UserSubscription {
  planId?: number;
  [key: string]: any;
}
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  CreditCard,
  Package,
  Briefcase,
  Users,
  Search,
  MessageCircle,
  Clock,
  Star,
  Loader2,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Parse URL parameters for jobId
  const urlParams = new URLSearchParams(window.location.search);
  const jobIdParam = urlParams.get('jobId');

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(jobIdParam ? 1 : null); // Set to Single Job plan (ID 1) if jobId is provided
  const [selectedJobId, setSelectedJobId] = useState<number | null>(jobIdParam ? parseInt(jobIdParam) : null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [checkoutData, setCheckoutData] = useState<{
    clientSecret: string;
    planId: number;
    planName: string;
    planDescription: string;
  } | null>(null);

  // Log parameters for debugging
  useEffect(() => {
    console.log("URL jobId parameter:", jobIdParam);
    console.log("Selected job ID:", selectedJobId);
    console.log("Selected plan ID:", selectedPlanId);
  }, [jobIdParam, selectedJobId, selectedPlanId]);

  // Fetch available subscription plans
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Fetch user's current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscription>({
    queryKey: ["/api/my-subscription"],
    enabled: !!user,
  });

  // Fetch user's jobs for the Single Job plan option
  const { data: userJobs, isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ["/api/my-jobs"],
    enabled: !!user && selectedPlanId === 1, // Only fetch when Single Job plan is selected
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (planId: number) => {
      // For Single Job plan, include the selected job ID
      const payload = planId === 1 
        ? { planId, billingCycle, jobId: selectedJobId } 
        : { planId, billingCycle };

      console.log("Subscribing with payload:", payload);  
      const res = await apiRequest("POST", "/api/create-payment-intent", payload);
      return await res.json();
    },
    onSuccess: (data) => {
      // Initialize Stripe checkout with the returned client secret
      const { clientSecret } = data;

      if (!clientSecret) {
        toast({
          title: "Subscription failed",
          description: "Failed to create payment intent. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Redirect to checkout page or process payment in-app
      toast({
        title: "Processing payment",
        description: "Please complete the payment process to activate your subscription.",
      });

      // Show the Stripe checkout component with the client secret
      setCheckoutData({
        clientSecret,
        planId: selectedPlanId!,
        planName: subscriptionPlans.find(p => p.id === selectedPlanId)?.name || 'Subscription',
        planDescription: subscriptionPlans.find(p => p.id === selectedPlanId)?.description || '',
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle successful payment
  const paymentSuccessMutation = useMutation({
    mutationFn: async ({ 
      paymentIntentId, 
      planId, 
      jobId 
    }: { 
      paymentIntentId: string;
      planId: number; 
      jobId?: number | null;
    }) => {
      const payload = jobId ? { paymentIntentId, planId, jobId } : { paymentIntentId, planId };
      const res = await apiRequest("POST", "/api/payment-success", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription successful!",
        description: "You have successfully subscribed to the Premium plan.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription"] });
      navigate("/my-jobs");
    },
    onError: (error: Error) => {
      console.error("Payment error:", error);
      toast({
        title: "Payment processing failed",
        description: "There was an issue activating your subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Process payment success (In a production app, this would use the Stripe SDK)
  const handlePaymentSuccess = (paymentIntentId: string) => {
    try {
      console.log("Processing payment for intent:", paymentIntentId);

      // Call the payment success endpoint
      paymentSuccessMutation.mutate({ 
        paymentIntentId, 
        planId: selectedPlanId!, 
        jobId: selectedPlanId === 1 ? selectedJobId : undefined 
      });
    } catch (error) {
      console.error("Payment handling error:", error);
      toast({
        title: "Payment processing error",
        description: "There was an error processing your payment information.",
        variant: "destructive",
      });
    }
  };

  // Handle subscription
  const handleSubscribe = () => {
    if (!selectedPlanId) {
      toast({
        title: "Select a plan",
        description: "Please select a subscription plan first.",
        variant: "destructive",
      });
      return;
    }

    // For Single Job plan, validate job selection
    if (selectedPlanId === 1 && !selectedJobId) {
      toast({
        title: "Select a job",
        description: "Please select which job you want to subscribe to.",
        variant: "destructive",
      });
      return;
    }

    subscribeMutation.mutate(selectedPlanId);
  };

  // Display loading state
  if (plansLoading || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Extract our three subscription plans from the API response, or use backups if not available
  let singleJobPlan: SubscriptionPlan | undefined = plans?.find(plan => plan.name === "Single Job");
  let allJobsPlan: SubscriptionPlan | undefined = plans?.find(plan => plan.name === "All Jobs");
  let premiumPlan: SubscriptionPlan | undefined = plans?.find(plan => plan.name === "Recruiter");

  // Add features to the Single Job plan
  if (singleJobPlan) {
    singleJobPlan = {
      ...singleJobPlan,
      features: [
        "Access applications for one job",
        "One-time fee (no recurring charges)",
        "Full applicant profiles",
        "Message with applicants"
      ]
    };
  } else {
    // Fallback if plan not found
    singleJobPlan = {
      id: 1,
      name: "Single Job",
      description: "Access applications for one specific job posting (one-time fee)",
      price: "9.99",
      maxSearches: 0,
      maxApplicantViews: 1000,
      isUnlimited: false,
      features: [
        "Access applications for one job",
        "One-time fee (no recurring charges)",
        "Full applicant profiles",
        "Message with applicants"
      ]
    };
  }

  // Add features to the All Jobs plan
  if (allJobsPlan) {
    allJobsPlan = {
      ...allJobsPlan,
      features: [
        "Access applications for all your jobs",
        "Monthly subscription",
        "Full applicant profiles",
        "Message with all applicants"
      ]
    };
  } else {
    // Fallback if plan not found
    allJobsPlan = {
      id: 2,
      name: "All Jobs",
      description: "Access applications for all your job postings (monthly fee)",
      price: "29.99",
      maxSearches: 0,
      maxApplicantViews: 1000,
      isUnlimited: false,
      features: [
        "Access applications for all your jobs",
        "Monthly subscription",
        "Full applicant profiles",
        "Message with all applicants"
      ]
    };
  }

  // Add features to the Premium plan
  if (premiumPlan) {
    premiumPlan = {
      ...premiumPlan,
      features: [
        "Proactive candidate search",
        "Unlimited applications for all jobs",
        "Advanced matching algorithm",
        "Priority placement in search results",
        "Analytics dashboard",
        "Priority support"
      ]
    };
  } else {
    // Fallback if plan not found
    premiumPlan = {
      id: 3,
      name: "Recruiter",
      description: "Full access to search for candidates proactively (monthly fee)",
      price: "199.00",
      maxSearches: 1000,
      maxApplicantViews: 1000,
      isUnlimited: true,
      features: [
        "Proactive candidate search",
        "Unlimited applications for all jobs",
        "Advanced matching algorithm",
        "Priority placement in search results",
        "Analytics dashboard",
        "Priority support"
      ]
    };
  }

  // Put the plans in an array for mapping
  // Hiding Tier 3 (Recruiter) plan as requested
  const subscriptionPlans: SubscriptionPlan[] = [singleJobPlan, allJobsPlan];

  return (
    <div className="bg-neutral-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold mb-3">Subscription Plans</h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Choose the right plan for your needs with our three-tier subscription system
            </p>
          </div>

          <Tabs defaultValue="monthly" className="mb-8">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="monthly" onClick={() => setBillingCycle("monthly")}>
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="yearly" onClick={() => setBillingCycle("yearly")}>
                  Yearly (Save 20%)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="monthly">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subscriptionPlans.map((plan) => {
                  // Determine badge and highlight styling for each plan
                  let badgeText = "";
                  let highlight = false;

                  if (plan.name === "Single Job") {
                    badgeText = "Level 1";
                  } else if (plan.name === "All Jobs") {
                    badgeText = "Level 2";
                    highlight = true;
                  } else if (plan.name === "Recruiter") {
                    badgeText = "Level 3";
                  }

                  return (
                    <Card 
                      key={plan.id} 
                      className={`overflow-hidden transition-all ${
                        selectedPlanId === plan.id 
                          ? 'ring-2 ring-primary border-primary'
                          : ''
                      } ${highlight ? 'shadow-lg scale-105 z-10' : ''}`}
                    >
                      <div className={`${highlight ? 'bg-primary' : 'bg-neutral-700'} text-white text-center py-1.5 text-sm font-medium`}>
                        {badgeText}
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-4">
                          <span className="text-3xl font-bold">£{typeof plan.price === 'string' ? plan.price : String(plan.price)}</span>
                          {plan.name !== "Single Job" && <span className="text-neutral-500">/month</span>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className={`w-full ${highlight ? 'bg-primary' : ''}`}
                          onClick={() => setSelectedPlanId(plan.id)}
                          variant={highlight ? "default" : "outline"}
                        >
                          {currentSubscription?.planId === plan.id ? "Current Plan" : "Select Plan"}
                        </Button>
                        <Separator className="my-6" />
                        <ul className="space-y-3">
                          {plan.features?.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                              <span className="text-neutral-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="yearly">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subscriptionPlans.map((plan) => {
                  // Skip yearly pricing option for Single Job since it's a one-time fee
                  if (plan.name === "Single Job") {
                    return (
                      <Card 
                        key={plan.id} 
                        className={`overflow-hidden transition-all ${
                          selectedPlanId === plan.id 
                            ? 'ring-2 ring-primary border-primary'
                            : ''
                        }`}
                      >
                        <div className="bg-neutral-700 text-white text-center py-1.5 text-sm font-medium">
                          Level 1
                        </div>
                        <CardHeader>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                          <div className="mt-4">
                            <span className="text-3xl font-bold">£{typeof plan.price === 'string' ? plan.price : String(plan.price)}</span>
                            <div className="text-sm text-neutral-600 mt-1">One-time payment</div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            className="w-full"
                            onClick={() => setSelectedPlanId(plan.id)}
                            variant="outline"
                          >
                            {currentSubscription?.planId === plan.id ? "Current Plan" : "Select Plan"}
                          </Button>
                          <Separator className="my-6" />
                          <ul className="space-y-3">
                            {plan.features?.map((feature, i) => (
                              <li key={i} className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                <span className="text-neutral-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Highlight "All Jobs" plan
                  const highlight = plan.name === "All Jobs";
                  const badgeText = plan.name === "All Jobs" ? "Level 2" : "Level 3";

                  return (
                    <Card 
                      key={plan.id} 
                      className={`overflow-hidden transition-all ${
                        selectedPlanId === plan.id 
                          ? 'ring-2 ring-primary border-primary'
                          : ''
                      } ${highlight ? 'shadow-lg scale-105 z-10' : ''}`}
                    >
                      <div className={`${highlight ? 'bg-primary' : 'bg-neutral-700'} text-white text-center py-1.5 text-sm font-medium`}>
                        {badgeText}
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-4">
                          <span className="text-3xl font-bold">£{(typeof plan.price === 'string' ? parseFloat(plan.price) * 0.8 : parseFloat(String(plan.price)) * 0.8).toFixed(2)}</span>
                          <span className="text-neutral-500">/month</span>
                          <div className="text-sm text-green-600 mt-1">Save 20% with annual billing</div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className={`w-full ${highlight ? 'bg-primary' : ''}`}
                          onClick={() => setSelectedPlanId(plan.id)}
                          variant={highlight ? "default" : "outline"}
                        >
                          {currentSubscription?.planId === plan.id ? "Current Plan" : "Select Plan"}
                        </Button>
                        <Separator className="my-6" />
                        <ul className="space-y-3">
                          {plan.features?.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                              <span className="text-neutral-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Job selector for Single Job plan */}
          {selectedPlanId === 1 && (
            <div className="max-w-md mx-auto my-8 p-6 border rounded-lg shadow-sm bg-white">
              <h3 className="text-lg font-semibold mb-4">Select a Job</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Choose which job you want to subscribe to. This will allow you to view applications 
                for this specific job posting.
              </p>

              {jobsLoading ? (
                <div className="py-4 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : userJobs && userJobs.length > 0 ? (
                <div className="space-y-3">
                  {userJobs.map((job: any) => (
                    <div 
                      key={job.id} 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedJobId === job.id ? 'border-primary bg-primary/5' : 'hover:bg-neutral-50'
                      }`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-neutral-500">
                            {job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {selectedJobId === job.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-neutral-600">
                  <p>You don't have any job postings yet.</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => navigate("/my-jobs")}
                  >
                    Create a job posting
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center mt-8">
            <Button 
              size="lg"
              onClick={handleSubscribe}
              disabled={!selectedPlanId || subscribeMutation.isPending || (selectedPlanId === 1 && !selectedJobId)}
              className="px-8"
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Subscribe Now
                </>
              )}
            </Button>
          </div>

          {/* Stripe Checkout */}
          {checkoutData && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full my-4">
                <button 
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" 
                  onClick={() => setCheckoutData(null)}
                >
                  <X className="h-6 w-6" />
                </button>
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                  <StripeCheckout 
                    planName={checkoutData.planName}
                    planDescription={checkoutData.planDescription}
                    clientSecret={checkoutData.clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setCheckoutData(null)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What happens if I reach my usage limits?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    Once you reach your monthly search or applicant view limits, you won't be able to 
                    perform additional actions until your plan resets at the beginning of the next billing cycle.
                    You can always upgrade to a higher tier at any time for additional capacity.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I cancel my subscription?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    Yes, you can cancel your subscription at any time. You will continue to have access 
                    to your subscription benefits until the end of your current billing cycle.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    We don't typically offer refunds, but please contact our support team for exceptional circumstances.
                    We're committed to ensuring you're satisfied with our service.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is there a free trial available?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    Currently, we don't offer a free trial for our Recruiter subscription.
                    However, you can create a free account to post jobs and browse available talent
                    without the advanced features included in the Recruiter plan.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}