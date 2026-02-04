import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Users, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  Shield, 
  Zap,
  ArrowLeft,
  RefreshCw,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  is_active: boolean;
  plan: string | null;
  created_at: string;
  activated_at: string | null;
}

interface ActivationRequest {
  id: string;
  user_id: string;
  plan_requested: string;
  method: string;
  reference: string;
  amount: string;
  note: string | null;
  status: string;
  created_at: string;
  profile?: Profile;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/app');
        toast({
          title: 'Access denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
      } else {
        fetchData();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, requestsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('activation_requests').select('*').order('created_at', { ascending: false }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setProfiles(profilesRes.data || []);
      
      // Attach profile to each request
      const requestsWithProfiles = (requestsRes.data || []).map((req) => ({
        ...req,
        profile: profilesRes.data?.find((p) => p.id === req.user_id),
      }));
      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (profileId: string, currentStatus: boolean) => {
    setActionLoading(profileId);
    try {
      const updateData: any = {
        is_active: !currentStatus,
      };
      
      if (!currentStatus) {
        updateData.activated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map((p) =>
        p.id === profileId
          ? { ...p, is_active: !currentStatus, activated_at: !currentStatus ? new Date().toISOString() : p.activated_at }
          : p
      ));
      toast({ title: `User ${!currentStatus ? 'activated' : 'deactivated'}` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPlan = async (profileId: string, plan: string) => {
    setActionLoading(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map((p) =>
        p.id === profileId ? { ...p, plan } : p
      ));
      toast({ title: `Plan updated to ${plan}` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setActionLoading(requestId);
    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      // Update request status
      const { error: requestError } = await supabase
        .from('activation_requests')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user!.id,
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // If approved, activate the user
      if (action === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_active: true,
            plan: request.plan_requested,
            activated_at: new Date().toISOString(),
          })
          .eq('id', request.user_id);

        if (profileError) throw profileError;

        // Update local state
        setProfiles(profiles.map((p) =>
          p.id === request.user_id
            ? { ...p, is_active: true, plan: request.plan_requested, activated_at: new Date().toISOString() }
            : p
        ));
      }

      setRequests(requests.map((r) =>
        r.id === requestId ? { ...r, status: action } : r
      ));

      toast({ title: `Request ${action}` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSeedData = async () => {
    if (!user) return;
    
    setActionLoading('seed');
    try {
      // Create sample clients
      const sampleClients = [
        { name: 'John Smith', contact: 'john@example.com', notes: 'VIP client, prefers email' },
        { name: 'Sarah Johnson', contact: '+1234567890', notes: 'WhatsApp preferred' },
        { name: 'Mike Wilson', contact: 'mike@business.com', notes: 'Payment pending from last month' },
      ];

      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .insert(sampleClients.map((c) => ({ ...c, user_id: user.id })))
        .select();

      if (clientError) throw clientError;

      // Create sample reminders
      const now = new Date();
      const sampleReminders = [
        {
          client_id: clients[0].id,
          remind_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          kind: 'followup',
          channel: 'email',
          message: `Hi ${clients[0].name}! Just checking in on our conversation. Let me know if you have any questions!`,
        },
        {
          client_id: clients[1].id,
          remind_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          kind: 'payment',
          channel: 'whatsapp',
          message: `Hi ${clients[1].name}! This is a friendly reminder about the pending payment. Please let me know if you have any questions.`,
        },
        {
          client_id: clients[2].id,
          remind_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          kind: 'payment',
          channel: 'email',
          message: `Hi ${clients[2].name}! Your payment is overdue. Please send at your earliest convenience.`,
        },
        {
          client_id: clients[0].id,
          remind_at: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          kind: 'followup',
          channel: 'email',
          message: `Hi ${clients[0].name}! Following up on our proposal. Would love to hear your thoughts.`,
        },
        {
          client_id: clients[1].id,
          remind_at: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
          kind: 'followup',
          channel: 'whatsapp',
          message: `Hi ${clients[1].name}! Hope you had a chance to review our offer. Let me know!`,
        },
        {
          client_id: clients[2].id,
          remind_at: now.toISOString(),
          kind: 'payment',
          channel: 'whatsapp',
          message: `Hi ${clients[2].name}! Just a quick reminder about the invoice due today.`,
        },
      ];

      const { error: reminderError } = await supabase
        .from('reminders')
        .insert(sampleReminders.map((r) => ({ ...r, user_id: user.id })));

      if (reminderError) throw reminderError;

      toast({
        title: 'Sample data created',
        description: '3 clients and 6 reminders added',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoMode = async () => {
    if (!user) return;

    setActionLoading('demo');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: true,
          plan: 'US',
          activated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Demo mode activated',
        description: 'Your account is now active. Refresh to see changes.',
      });

      // Refresh the page to update auth state
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/app" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to App</span>
            </Link>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">PayPing</span>
              <Badge variant="secondary">Admin</Badge>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="container px-4 py-8">
        {/* Quick Actions */}
        <Card className="border-0 shadow-premium mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleDemoMode}
              disabled={actionLoading === 'demo'}
            >
              {actionLoading === 'demo' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Zap className="w-4 h-4 mr-2" />
              Activate My Account (Demo)
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleSeedData}
              disabled={actionLoading === 'seed'}
            >
              {actionLoading === 'seed' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Database className="w-4 h-4 mr-2" />
              Seed Sample Data
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="requests">
          <TabsList className="mb-6">
            <TabsTrigger value="requests" className="relative">
              Activation Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center" variant="destructive">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">All Users ({profiles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {requests.length === 0 ? (
              <Card className="border-0 shadow-premium">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No activation requests</h3>
                  <p className="text-muted-foreground">Requests will appear here when users submit payments.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="border-0 shadow-premium">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{request.profile?.email || 'Unknown'}</span>
                            <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'default' : 'destructive'}>
                              {request.status}
                            </Badge>
                            <Badge variant="outline">{request.plan_requested}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium text-foreground">Method:</span> {request.method}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Amount:</span> {request.amount}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Reference:</span> {request.reference}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Date:</span> {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          {request.note && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <span className="font-medium text-foreground">Note:</span> {request.note}
                            </p>
                          )}
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="rounded-lg"
                              onClick={() => handleRequestAction(request.id, 'approved')}
                              disabled={actionLoading === request.id}
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => handleRequestAction(request.id, 'rejected')}
                              disabled={actionLoading === request.id}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-4">
              {profiles.map((profile) => (
                <Card key={profile.id} className="border-0 shadow-premium">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{profile.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={profile.plan || 'none'}
                          onValueChange={(value) => handleSetPlan(profile.id, value === 'none' ? '' : value)}
                        >
                          <SelectTrigger className="w-32 rounded-xl">
                            <SelectValue placeholder="Set plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No plan</SelectItem>
                            <SelectItem value="US">US ($29)</SelectItem>
                            <SelectItem value="EA">EA ($10)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant={profile.is_active ? 'destructive' : 'default'}
                          className="rounded-xl"
                          onClick={() => handleToggleActive(profile.id, profile.is_active)}
                          disabled={actionLoading === profile.id}
                        >
                          {actionLoading === profile.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : profile.is_active ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
