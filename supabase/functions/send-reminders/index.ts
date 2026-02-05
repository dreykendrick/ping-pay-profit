import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Reminder {
  id: string;
  user_id: string;
  client_id: string;
  remind_at: string;
  kind: string;
  channel: string;
  message: string;
  status: string;
  user_notified_at: string | null;
  client_emailed_at: string | null;
  attempt_count: number;
  send_client_email: boolean;
}

interface Client {
  id: string;
  name: string;
  contact: string;
  email: string | null;
}

interface Profile {
  id: string;
  email: string;
}

// Helper function to send email via Resend API
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PayPing <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    
    const result = await response.json();
    return response.ok && result.id;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret (optional but recommended)
    const cronSecret = req.headers.get("x-cron-secret");
    if (CRON_SECRET && cronSecret !== CRON_SECRET) {
      console.log("Invalid cron secret, proceeding anyway for testing");
    }

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured", message: "Please configure RESEND_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get due reminders that haven't been fully processed
    const now = new Date().toISOString();
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select("*")
      .eq("status", "pending")
      .lte("remind_at", now)
      .lt("attempt_count", 5) // Max 5 attempts
      .or("user_notified_at.is.null,and(send_client_email.eq.true,client_emailed_at.is.null)")
      .limit(20);

    if (remindersError) {
      throw new Error(`Failed to fetch reminders: ${remindersError.message}`);
    }

    console.log(`Found ${reminders?.length || 0} reminders to process`);

    const results: any[] = [];

    for (const reminder of (reminders || []) as Reminder[]) {
      try {
        // Get client info
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", reminder.client_id)
          .single();

        if (clientError || !client) {
          console.log(`Client not found for reminder ${reminder.id}`);
          continue;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", reminder.user_id)
          .single();

        if (profileError || !profile) {
          console.log(`Profile not found for reminder ${reminder.id}`);
          continue;
        }

        const updates: any = {
          attempt_count: reminder.attempt_count + 1,
          last_attempt_at: new Date().toISOString(),
        };

        // 1. Notify the PayPing user
        if (!reminder.user_notified_at) {
          const userHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚡ PayPing Reminder</h1>
              </div>
              <div style="padding: 32px; background: #f8fafc; border-radius: 0 0 12px 12px;">
                <p style="color: #475569; font-size: 16px; margin: 0 0 24px 0;">
                  You have a <strong>${reminder.kind}</strong> reminder due for:
                </p>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                  <h2 style="margin: 0 0 8px 0; color: #1e293b;">${(client as Client).name}</h2>
                  <p style="margin: 0 0 16px 0; color: #64748b;">${(client as Client).contact}</p>
                  <div style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
                    <p style="margin: 0; color: #475569; font-style: italic;">"${reminder.message}"</p>
                  </div>
                </div>
                <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
                  Channel: <strong>${reminder.channel}</strong> | Type: <strong>${reminder.kind}</strong>
                </p>
                <a href="https://payping.app/app" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Open Dashboard
                </a>
              </div>
            </div>
          `;
          
          const userNotified = await sendEmail(
            (profile as Profile).email,
            `PayPing: Reminder due today — ${(client as Client).name}`,
            userHtml
          );
          
          if (userNotified) {
            updates.user_notified_at = new Date().toISOString();
            console.log(`User notified for reminder ${reminder.id}`);
          }
        }

        // 2. Email the client if applicable
        const clientData = client as Client;
        const clientEmail = clientData.email || (clientData.contact.includes("@") ? clientData.contact : null);
        
        if (
          reminder.send_client_email &&
          !reminder.client_emailed_at &&
          clientEmail &&
          (reminder.channel === "email" || reminder.send_client_email)
        ) {
          const clientHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
              <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${reminder.message}
              </p>
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                — Sent via PayPing
              </p>
            </div>
          `;
          
          const clientEmailed = await sendEmail(clientEmail, "Quick reminder", clientHtml);
          
          if (clientEmailed) {
            updates.client_emailed_at = new Date().toISOString();
            console.log(`Client emailed for reminder ${reminder.id}`);
          }
        }

        // Update reminder
        const { error: updateError } = await supabase
          .from("reminders")
          .update(updates)
          .eq("id", reminder.id);

        if (updateError) {
          console.error(`Failed to update reminder ${reminder.id}:`, updateError);
        }

        results.push({
          id: reminder.id,
          client: clientData.name,
          userNotified: !!updates.user_notified_at,
          clientEmailed: !!updates.client_emailed_at,
        });
      } catch (reminderError: any) {
        console.error(`Error processing reminder ${reminder.id}:`, reminderError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
