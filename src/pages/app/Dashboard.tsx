import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, isThisWeek, isPast, startOfDay } from 'date-fns';
import { Bell, Users, Clock, AlertCircle, Plus, Copy, Check, ArrowRight, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';

interface Reminder {
  id: string;
  remind_at: string;
  kind: string;
  channel: string;
  message: string;
  status: string;
  done_at: string | null;
  client: {
    id: string;
    name: string;
    contact: string;
  };
}

export default function Dashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch all reminders with client info
      const { data: reminderData, error: reminderError } = await supabase
        .from('reminders')
        .select('*, client:clients(*)')
        .eq('user_id', user!.id)
        .order('remind_at', { ascending: true });

      if (reminderError) throw reminderError;
      setReminders(reminderData as Reminder[]);

      // Fetch client count
      const { count, error: countError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if (countError) throw countError;
      setClientCount(count || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async (message: string) => {
    await navigator.clipboard.writeText(message);
    toast({
      title: 'Copied!',
      description: 'Paste into WhatsApp or Email.',
    });
  };

  const handleMarkDone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'done', done_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setReminders(reminders.map(r => 
        r.id === id ? { ...r, status: 'done', done_at: new Date().toISOString() } : r
      ));
      toast({
        title: 'Done!',
        description: 'Reminder marked as complete.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update reminder',
        variant: 'destructive',
      });
    }
  };

  const now = new Date();
  const todayStart = startOfDay(now);

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const dueToday = pendingReminders.filter((r) => isToday(new Date(r.remind_at)));
  const dueThisWeek = pendingReminders.filter((r) => {
    const date = new Date(r.remind_at);
    return isThisWeek(date) && !isToday(date) && !isPast(date);
  });
  const overdue = pendingReminders.filter((r) => {
    const date = new Date(r.remind_at);
    return isPast(date) && date < todayStart;
  });
  const completedToday = reminders.filter((r) => 
    r.status === 'done' && r.done_at && isToday(new Date(r.done_at))
  );

  const stats = [
    {
      title: 'Due Today',
      value: dueToday.length,
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      href: '/app/reminders?tab=today',
    },
    {
      title: 'Due This Week',
      value: dueThisWeek.length,
      icon: Calendar,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent',
      href: '/app/reminders?tab=week',
    },
    {
      title: 'Overdue',
      value: overdue.length,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      href: '/app/reminders?tab=overdue',
    },
    {
      title: 'Completed Today',
      value: completedToday.length,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
      href: '/app/reminders?tab=done',
    },
  ];

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-premium">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Due today skeleton */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Dashboard"
        description="View today's follow-ups, upcoming reminders, and overdue tasks."
        noIndex={true}
      />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{profile?.email ? `, ${profile.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">Here's what needs your attention today</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link to="/app/reminders?new=true">
            <Plus className="w-4 h-4 mr-2" />
            New Reminder
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="border-0 shadow-premium hover:shadow-premium-xl transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats Bar */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">{clientCount}</span>
          <span className="text-muted-foreground">clients</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">{pendingReminders.length}</span>
          <span className="text-muted-foreground">pending reminders</span>
        </div>
        <div className="ml-auto">
          <Button asChild variant="ghost" size="sm" className="rounded-lg">
            <Link to="/app/clients">
              View Clients <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Due Today Section */}
      <Card className="border-0 shadow-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Due Today
          </CardTitle>
          <Link to="/app/reminders" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {dueToday.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground mb-4">No reminders due today. Great job staying on top of things!</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/app/reminders?new=true">Create a Reminder</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {dueToday.slice(0, 5).map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{reminder.client.name}</span>
                      <Badge variant={reminder.kind === 'payment' ? 'destructive' : 'secondary'}>
                        {reminder.kind}
                      </Badge>
                      <Badge variant="outline">{reminder.channel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{reminder.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(reminder.remind_at), 'h:mm a')} • {reminder.client.contact}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => handleCopyMessage(reminder.message)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      onClick={() => handleMarkDone(reminder.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </div>
              ))}
              {dueToday.length > 5 && (
                <div className="text-center pt-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/app/reminders?tab=today">
                      View all {dueToday.length} reminders
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <Card className="border-0 shadow-premium border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Overdue ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdue.slice(0, 3).map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-destructive/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{reminder.client.name}</span>
                      <Badge variant="destructive">{reminder.kind}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Due {format(new Date(reminder.remind_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => handleCopyMessage(reminder.message)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-lg"
                      onClick={() => handleMarkDone(reminder.id)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ))}
              {overdue.length > 3 && (
                <div className="text-center pt-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/app/reminders?tab=overdue">
                      View all {overdue.length} overdue
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
