import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { User, CreditCard, Shield, RefreshCw, Loader2, MapPin, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

interface ActivationRequest {
  id: string;
  plan_requested: string;
  status: string;
  created_at: string;
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [activationRequests, setActivationRequests] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivationRequests();
    }
  }, [user]);

  const fetchActivationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('activation_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivationRequests(data || []);
    } catch (error) {
      console.error('Error fetching activation requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([refreshProfile(), fetchActivationRequests()]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Settings"
        description="Manage your PayPing account and subscription settings."
        noIndex={true}
      />
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and subscription</p>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
        </Button>
      </div>

      {/* Account Info */}
      <Card className="border-0 shadow-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={profile?.is_active ? 'default' : 'secondary'}>
              {profile?.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-muted-foreground">Member since</span>
            <span>{profile?.created_at ? format(new Date(profile.created_at), 'MMM d, yyyy') : '-'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Region & Subscription */}
      <Card className="border-0 shadow-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.country && (
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Region
              </span>
              <span className="font-medium">{profile.country}</span>
            </div>
          )}
          {profile?.monthly_price ? (
            <>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Your pricing
                </span>
                <span className="font-medium">${profile.monthly_price}/month</span>
              </div>
              {profile?.activated_at && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">Activated</span>
                  <span>{format(new Date(profile.activated_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No active subscription</p>
              <Button asChild className="rounded-xl">
                <Link to="/pay">Subscribe Now</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activation Requests */}
      {activationRequests.length > 0 && (
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Activation Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activationRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                >
                  <div>
                    <p className="font-medium">Activation Request</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      request.status === 'approved'
                        ? 'default'
                        : request.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refund Policy */}
      <Card className="border-0 shadow-premium bg-muted/30">
        <CardContent className="py-6">
          <h3 className="font-semibold mb-2">Refund Policy</h3>
          <p className="text-sm text-muted-foreground">
            7-day money-back guarantee. If PayPing doesn't help you stay organized and follow up better within the first 7 days, we'll refund your payment in full — no questions asked.
          </p>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
