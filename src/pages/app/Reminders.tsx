import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isToday, isThisWeek, isPast, startOfDay } from 'date-fns';
import { Plus, Search, Edit2, Trash2, Copy, Check, Loader2, Bell, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const reminderSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  remind_at: z.string().min(1, 'Please select a date and time'),
  kind: z.enum(['followup', 'payment']),
  channel: z.enum(['whatsapp', 'email']),
  message: z.string().min(1, 'Message is required').max(1000),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface Client {
  id: string;
  name: string;
  contact: string;
}

interface Reminder {
  id: string;
  remind_at: string;
  kind: string;
  channel: string;
  message: string;
  status: string;
  client: Client;
}

const MESSAGE_TEMPLATES = {
  followup: {
    whatsapp: 'Hi {name}! Just checking in on our conversation. Let me know if you have any questions!',
    email: 'Hi {name},\n\nI wanted to follow up on our recent conversation. Please let me know if you have any questions or if there\'s anything I can help with.\n\nBest regards',
  },
  payment: {
    whatsapp: 'Hi {name}! This is a friendly reminder about the pending payment. Please let me know if you have any questions.',
    email: 'Hi {name},\n\nThis is a friendly reminder about your pending payment. Please let me know if you have any questions or concerns.\n\nBest regards',
  },
};

export default function Reminders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('new') === 'true');
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteReminder, setDeleteReminder] = useState<Reminder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      client_id: '',
      remind_at: '',
      kind: 'followup',
      channel: 'whatsapp',
      message: '',
    },
  });

  // Watch for kind and channel changes to update template
  const watchKind = form.watch('kind');
  const watchChannel = form.watch('channel');
  const watchClientId = form.watch('client_id');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    // Update message template when kind/channel/client changes
    if (!editingReminder && watchKind && watchChannel) {
      const selectedClient = clients.find((c) => c.id === watchClientId);
      const template = MESSAGE_TEMPLATES[watchKind as keyof typeof MESSAGE_TEMPLATES][watchChannel as keyof typeof MESSAGE_TEMPLATES.followup];
      const message = selectedClient
        ? template.replace('{name}', selectedClient.name)
        : template.replace('{name}', 'there');
      form.setValue('message', message);
    }
  }, [watchKind, watchChannel, watchClientId, clients, editingReminder]);

  const fetchData = async () => {
    try {
      const [remindersRes, clientsRes] = await Promise.all([
        supabase
          .from('reminders')
          .select('*, client:clients(*)')
          .eq('user_id', user!.id)
          .order('remind_at', { ascending: true }),
        supabase
          .from('clients')
          .select('id, name, contact')
          .eq('user_id', user!.id)
          .order('name'),
      ]);

      if (remindersRes.error) throw remindersRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setReminders(remindersRes.data as Reminder[]);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReminderFormData) => {
    setIsSubmitting(true);
    try {
      if (editingReminder) {
        const { error } = await supabase
          .from('reminders')
          .update({
            client_id: data.client_id,
            remind_at: new Date(data.remind_at).toISOString(),
            kind: data.kind,
            channel: data.channel,
            message: data.message,
          })
          .eq('id', editingReminder.id);

        if (error) throw error;
        toast({ title: 'Reminder updated' });
      } else {
        const { error } = await supabase.from('reminders').insert({
          user_id: user!.id,
          client_id: data.client_id,
          remind_at: new Date(data.remind_at).toISOString(),
          kind: data.kind,
          channel: data.channel,
          message: data.message,
        });

        if (error) throw error;
        toast({ title: 'Reminder created' });
      }

      await fetchData();
      setDialogOpen(false);
      setEditingReminder(null);
      form.reset();
      setSearchParams({});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReminder) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', deleteReminder.id);

      if (error) throw error;

      setReminders(reminders.filter((r) => r.id !== deleteReminder.id));
      toast({ title: 'Reminder deleted' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteReminder(null);
    }
  };

  const handleCopy = async (message: string) => {
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

      setReminders(reminders.map((r) =>
        r.id === id ? { ...r, status: 'done' } : r
      ));
      toast({ title: 'Marked as done' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (reminder: Reminder) => {
    setEditingReminder(reminder);
    form.reset({
      client_id: reminder.client.id,
      remind_at: format(new Date(reminder.remind_at), "yyyy-MM-dd'T'HH:mm"),
      kind: reminder.kind as 'followup' | 'payment',
      channel: reminder.channel as 'whatsapp' | 'email',
      message: reminder.message,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingReminder(null);
    form.reset({
      client_id: '',
      remind_at: '',
      kind: 'followup',
      channel: 'whatsapp',
      message: MESSAGE_TEMPLATES.followup.whatsapp.replace('{name}', 'there'),
    });
    setDialogOpen(true);
  };

  // Filter reminders
  const now = new Date();
  const todayStart = startOfDay(now);

  const filterReminders = (reminders: Reminder[]) => {
    let filtered = reminders.filter((r) =>
      r.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (activeTab) {
      case 'today':
        return filtered.filter((r) => r.status === 'pending' && isToday(new Date(r.remind_at)));
      case 'week':
        return filtered.filter((r) => r.status === 'pending' && isThisWeek(new Date(r.remind_at)));
      case 'overdue':
        return filtered.filter((r) => {
          const date = new Date(r.remind_at);
          return r.status === 'pending' && isPast(date) && date < todayStart;
        });
      case 'done':
        return filtered.filter((r) => r.status === 'done');
      default:
        return filtered;
    }
  };

  const filteredReminders = filterReminders(reminders);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">Track and manage all your follow-ups</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSearchParams({});
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Create Reminder'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
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
                  name="remind_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="h-12 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="followup">Follow-up</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your message..."
                          className="rounded-xl resize-none min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-12 rounded-xl" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search reminders..."
          className="pl-12 h-12 rounded-xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-lg">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <Card className="border-0 shadow-premium">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No reminders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first reminder to get started'}
            </p>
            {!searchQuery && (
              <Button className="rounded-xl" onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create Reminder
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => {
            const reminderDate = new Date(reminder.remind_at);
            const isOverdue = reminder.status === 'pending' && isPast(reminderDate) && reminderDate < todayStart;
            const isDone = reminder.status === 'done';

            return (
              <Card
                key={reminder.id}
                className={`border-0 shadow-premium ${isOverdue ? 'border-l-4 border-l-destructive' : ''} ${isDone ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold">{reminder.client.name}</span>
                        <Badge variant={reminder.kind === 'payment' ? 'destructive' : 'secondary'}>
                          {reminder.kind}
                        </Badge>
                        <Badge variant="outline">{reminder.channel}</Badge>
                        {isDone && <Badge variant="secondary">Done</Badge>}
                        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{reminder.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{format(reminderDate, 'MMM d, yyyy h:mm a')}</span>
                        <span>{reminder.client.contact}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isDone && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => handleCopy(reminder.message)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-lg"
                            onClick={() => handleMarkDone(reminder.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg"
                        onClick={() => openEditDialog(reminder)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg text-destructive hover:text-destructive"
                        onClick={() => setDeleteReminder(reminder)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteReminder} onOpenChange={() => setDeleteReminder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this reminder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
