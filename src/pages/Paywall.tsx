import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, ArrowLeft, Loader2, Check, Clock, CreditCard } from 'lucide-react';
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
  plan: z.enum(['US', 'EA']),
  method: z.string().min(1, 'Please select a payment method'),
  reference: z.string().min(1, 'Please enter your payment reference'),
  amount: z.string().min(1, 'Please enter the amount paid'),
  note: z.string().optional(),
});

type ActivationFormData = z.infer<typeof activationSchema>;

export default function Paywall() {
  const [selectedPlan, setSelectedPlan] = useState<'US' | 'EA'>('US');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAdmin, signOut, loading } = useAuth();

  // Redirect admins to admin panel
  useEffect(() => {
    if (!loading && isAdmin) {
      navigate('/admin');
    }
  }, [loading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const form = useForm<ActivationFormData>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      plan: 'US',
      method: '',
      reference: '',
      amount: '',
      note: '',
    },
  });

  const onSubmit = async (data: ActivationFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('activation_requests').insert({
        user_id: user.id,
        plan_requested: data.plan,
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

  const currentPlan = PLANS[selectedPlan];

  if (requestSubmitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
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
                className="w-full"
                onClick={() => window.location.reload()}
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
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">One-time setup</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Pay to unlock PayPing
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choose your plan, pay with your preferred method, and we'll activate your account within hours.
            </p>
          </div>

          {!showForm ? (
            <>
              {/* Plan selection */}
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {Object.values(PLANS).map((plan) => (
                  <button
                    key={plan.id}
                    className={`text-left p-6 rounded-2xl border-2 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlan(plan.id as 'US' | 'EA')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      {selectedPlan === plan.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-4">{plan.description}</p>
                    <p className="text-3xl font-bold">
                      ${plan.price}
                      <span className="text-base font-normal text-muted-foreground">/month</span>
                    </p>
                  </button>
                ))}
              </div>

              {/* Payment methods */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Payment Methods for {currentPlan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {currentPlan.paymentMethods.map((method) => (
                      <div
                        key={method.name}
                        className="p-4 rounded-xl bg-muted/50 border"
                      >
                        <h4 className="font-semibold mb-1">{method.name}</h4>
                        <p className="text-sm text-muted-foreground">{method.instruction}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button
                  size="lg"
                  className="rounded-xl px-8"
                  onClick={() => {
                    form.setValue('plan', selectedPlan);
                    setShowForm(true);
                  }}
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
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <button
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                  onClick={() => setShowForm(false)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to plans
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
                              placeholder={`$${currentPlan.price}`}
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
