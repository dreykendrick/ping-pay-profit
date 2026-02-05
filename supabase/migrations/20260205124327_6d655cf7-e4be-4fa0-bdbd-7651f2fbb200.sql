-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the send-reminders function to run every 5 minutes
SELECT cron.schedule(
  'send-reminders-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://gvoxisaknjouqmgohier.supabase.co/functions/v1/send-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2b3hpc2FrbmpvdXFtZ29oaWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDA0OTUsImV4cCI6MjA4NTgxNjQ5NX0.YF6BtQRK2q1wisoJ5B_DIlddZFgpHSCTJoGqEkH96j4"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);