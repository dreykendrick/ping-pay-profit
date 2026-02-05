import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Globe, Loader2, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Countries list with US and Tanzania first, then common countries
const COUNTRIES = [
  { code: 'US', name: 'United States', plan: 'US', price: 29 },
  { code: 'TZ', name: 'Tanzania', plan: 'EA', price: 10 },
  { code: 'KE', name: 'Kenya', plan: 'EA', price: 10 },
  { code: 'UG', name: 'Uganda', plan: 'EA', price: 10 },
  { code: 'RW', name: 'Rwanda', plan: 'EA', price: 10 },
  { code: 'NG', name: 'Nigeria', plan: 'EA', price: 10 },
  { code: 'GH', name: 'Ghana', plan: 'EA', price: 10 },
  { code: 'ZA', name: 'South Africa', plan: 'EA', price: 10 },
  { code: 'GB', name: 'United Kingdom', plan: 'EA', price: 10 },
  { code: 'CA', name: 'Canada', plan: 'EA', price: 10 },
  { code: 'AU', name: 'Australia', plan: 'EA', price: 10 },
  { code: 'DE', name: 'Germany', plan: 'EA', price: 10 },
  { code: 'FR', name: 'France', plan: 'EA', price: 10 },
  { code: 'IN', name: 'India', plan: 'EA', price: 10 },
  { code: 'PK', name: 'Pakistan', plan: 'EA', price: 10 },
  { code: 'BD', name: 'Bangladesh', plan: 'EA', price: 10 },
  { code: 'PH', name: 'Philippines', plan: 'EA', price: 10 },
  { code: 'BR', name: 'Brazil', plan: 'EA', price: 10 },
  { code: 'MX', name: 'Mexico', plan: 'EA', price: 10 },
  { code: 'OTHER', name: 'Other', plan: 'EA', price: 10 },
] as const;

const onboardingSchema = z.object({
  country: z.string().min(1, 'Please select your country'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, refreshProfile, signOut } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (profile?.country) {
        // Already onboarded, redirect appropriately
        if (profile.is_active) {
          navigate('/app');
        } else {
          navigate('/pay');
        }
      }
    }
  }, [user, profile, loading, navigate]);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      country: '',
    },
  });

  const selectedCountry = COUNTRIES.find(c => c.code === form.watch('country'));

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) return;

    const country = COUNTRIES.find(c => c.code === data.country);
    if (!country) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          country: country.name,
          plan: country.plan,
          monthly_price: country.price,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Welcome to PayPing!',
        description: 'Your account is set up. Complete payment to get started.',
      });

      navigate('/pay');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save your information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PayPing</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container px-4 py-12 max-w-lg mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
            1
          </div>
          <div className="w-12 h-1 bg-muted rounded" />
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
            2
          </div>
          <div className="w-12 h-1 bg-muted rounded" />
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
            3
          </div>
        </div>

        <Card className="border-0 shadow-premium">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Where are you based?</CardTitle>
            <CardDescription className="text-base">
              This helps us set up your account with the right payment options.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Your Country</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className={cn(
                                "h-14 rounded-xl justify-between text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                {field.value
                                  ? COUNTRIES.find((c) => c.code === field.value)?.name
                                  : "Select your country"}
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search countries..." />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {COUNTRIES.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    value={country.name}
                                    onSelect={() => {
                                      form.setValue("country", country.code);
                                      setOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === country.code
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {country.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Your region determines available payment methods.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedCountry && (
                  <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-success">Your pricing: ${selectedCountry.price}/month</p>
                        <p className="text-sm text-muted-foreground">
                          Payment options for {selectedCountry.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl text-lg"
                  disabled={isLoading || !form.watch('country')}
                >
                  {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  Continue to Payment
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact us at support@payping.app
        </p>
      </div>
    </div>
  );
}
