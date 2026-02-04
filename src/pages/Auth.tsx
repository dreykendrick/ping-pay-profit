import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(
    searchParams.get('mode') === 'login' ? 'login' : 
    searchParams.get('mode') === 'forgot' ? 'forgot' : 'signup'
  );
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, signIn, signUp } = useAuth();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on activation status
      if (profile.is_active) {
        navigate('/app');
      } else {
        navigate('/pay');
      }
    }
  }, [user, profile, loading, navigate]);

  const handleForgotPassword = async () => {
    const email = form.getValues('email');
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError('email', { message: 'Please enter a valid email' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      });
      setMode('login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await signUp(data.email, data.password);
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link. Click it to activate your account.',
        });
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
        // Navigation handled by useEffect
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">PayPing</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {mode === 'signup' ? 'Create your account' : 
             mode === 'forgot' ? 'Reset your password' : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === 'signup'
              ? 'Start tracking follow-ups and payments'
              : mode === 'forgot' 
              ? 'Enter your email to receive a reset link'
              : 'Sign in to your account'}
          </p>

          <Form {...form}>
            <form onSubmit={mode === 'forgot' ? (e) => { e.preventDefault(); handleForgotPassword(); } : form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="h-12 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode !== 'forgot' && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {mode === 'login' && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setMode('forgot')}
                >
                  Forgot password?
                </button>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-lg"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === 'signup' ? 'Create Account' : 
                 mode === 'forgot' ? 'Send Reset Link' : 'Sign In'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => setMode('login')}
                >
                  Sign in
                </button>
              </>
            ) : mode === 'forgot' ? (
              <>
                Remember your password?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => setMode('login')}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => setMode('signup')}
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-4xl font-bold mb-6">
            Stop losing money to forgotten follow-ups
          </h2>
          <p className="text-lg opacity-90 mb-8">
            PayPing shows you exactly who to contact today. One tap to copy your message, paste into WhatsApp or email — done.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                ✓
              </div>
              <span>Never miss a follow-up again</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                ✓
              </div>
              <span>Track who owes you money</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                ✓
              </div>
              <span>Ready-to-send message templates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
