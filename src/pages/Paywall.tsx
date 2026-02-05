import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, ArrowLeft, Loader2, Clock, CreditCard, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PLANS } from '@/lib/constants';

const activationSchema = z.object({
  method: z.string().min(1, 'Please select a payment method'),
  reference: z.string().min(1, 'Please enter your payment reference'),
  amount: z.string().min(1, 'Please enter the amount paid'),
  note: z.string().optional(),
});

type ActivationFormData = z.infer<typeof activationSchema>;

export default function Paywall() {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{ status: string } | null>(null);
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, signOut, loading, refreshProfile } = useAuth();

  // Check for existing pending request
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (user) {
        const { data } = await supabase
          .from('activation_requests')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();
        
        if (data) {
          setPendingRequest(data);
          setRequestSubmitted(true);
        }
      }
    };
    checkExistingRequest();
  }, [user]);

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (isAdmin) {
        navigate('/admin');
      } else if (!profile?.country) {
        navigate('/onboarding');
      } else if (profile?.is_active) {
        navigate('/app');
      }
    }
  }, [loading, user, isAdmin, profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const form = useForm<ActivationFormData>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      method: '',
      reference: '',
      amount: '',
      note: '',
    },
  });

  const onSubmit = async (data: ActivationFormData) => {
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('activation_requests').insert({
        user_id: user.id,
        plan_requested: profile.plan || 'EA',
        method: data.method,
        reference: data.reference,
        amount: data.amount,
        note: data.note || null,
      });

      if (error) throw error;

      setRequestSubmitted(true);
      toast({
        title: 'Request submitted!',
        description: 'We\'ll activate your account as soon as we confirm your payment.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInstruction = async (method: string, instruction: string) => {
    await navigator.clipboard.writeText(instruction);
    setCopiedMethod(method);
    toast({
      title: 'Copied!',
      description: 'Payment details copied to clipboard.',
    });
    setTimeout(() => setCopiedMethod(null), 2000);
  };

  // Get the plan based on user's profile
  const currentPlan = profile?.plan ? PLANS[profile.plan as keyof typeof PLANS] : PLANS.EA;
  const price = profile?.monthly_price || currentPlan.price;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requestSubmitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-premium">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Activation Pending</h2>
            <p className="text-muted-foreground mb-6">
              Thanks for your payment! We're reviewing your request and will activate your account shortly — usually within a few hours.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  refreshProfile();
                  window.location.reload();
                }}
              >
                Refresh Status
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PayPing</span>
          </Link>
          <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container px-4 py-12">
        <div className="max-w-lg mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center text-success-foreground text-sm font-medium">
              <Check className="w-4 h-4" />
            </div>
            <div className="w-12 h-1 bg-primary rounded" />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              2
            </div>
            <div className="w-12 h-1 bg-muted rounded" />
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
              3
            </div>
          </div>

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Step 2 of 3</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">
              Complete your payment
            </h1>
            <p className="text-muted-foreground">
              Pay with your preferred method and we'll activate your account within hours.
            </p>
          </div>

          {!showForm ? (
            <>
              {/* Price display */}
              <Card className="border-0 shadow-premium mb-6">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your pricing ({profile?.country || 'Region'})</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment methods */}
              <Card className="border-0 shadow-premium mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentPlan.paymentMethods.map((method) => (
                    <div
                      key={method.name}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border hover:border-primary/30 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold">{method.name}</h4>
                        <p className="text-sm text-muted-foreground">{method.instruction}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => handleCopyInstruction(method.name, method.instruction)}
                      >
                        {copiedMethod === method.name ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="text-center">
                <Button
                  size="lg"
                  className="w-full rounded-xl py-6 text-lg"
                  onClick={() => setShowForm(true)}
                >
                  I've Paid — Request Activation
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  7-day money-back guarantee if PayPing doesn't help you.
                </p>
              </div>
            </>
          ) : (
            /* Activation form */
            <Card className="border-0 shadow-premium">
              <CardHeader>
                <button
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                  onClick={() => setShowForm(false)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to payment methods
                </button>
                <CardTitle>Submit Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currentPlan.paymentMethods.map((method) => (
                                <SelectItem key={method.name} value={method.name}>
                                  {method.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Reference / Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Transaction ID or sender name"
                              className="h-12 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Paid</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`$${price}`}
                              className="h-12 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional information..."
                              className="rounded-xl resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Request
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
