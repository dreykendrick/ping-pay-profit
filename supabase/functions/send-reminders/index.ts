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
async function sendEmail(
  to: string, 
  subject: string, 
  html: string,
  replyTo?: string,
  fromName?: string
): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  
  try {
    const from = fromName 
      ? `${fromName} via PayPing <onboarding@resend.dev>`
      : "PayPing <onboarding@resend.dev>";
    
    const emailPayload: any = {
      from,
      to: [to],
      subject,
      html,
    };
    
    // FIX 5: Add Reply-To header so clients can reply directly to the user
    if (replyTo) {
      emailPayload.reply_to = replyTo;
    }
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
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
    // FIX 2: CRON ENDPOINT SECURITY - Validate secret FIRST before any processing
    const cronSecret = req.headers.get("x-cron-secret");
    if (CRON_SECRET && cronSecret !== CRON_SECRET) {
      console.error("Unauthorized cron access attempt - invalid secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid cron secret" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured", message: "Please configure RESEND_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // FIX 4: Get ONLY pending reminders that haven't been fully processed
    // A reminder is complete when:
    // - user_notified_at is set AND
    // - (send_client_email is false OR client_emailed_at is set)
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

        let userNotified = !!reminder.user_notified_at;
        let clientEmailed = !!reminder.client_emailed_at;

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
                <a href="https://ping-pay-profit.lovable.app/app" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Open Dashboard
                </a>
              </div>
            </div>
          `;
          
          userNotified = await sendEmail(
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
        const profileData = profile as Profile;
        const clientEmail = clientData.email || (clientData.contact.includes("@") ? clientData.contact : null);
        
        if (
          reminder.send_client_email &&
          !reminder.client_emailed_at &&
          clientEmail
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
          
          // FIX 5: Add Reply-To so client can respond directly to user
          clientEmailed = await sendEmail(
            clientEmail, 
            "Quick reminder", 
            clientHtml,
            profileData.email, // Reply-To: user's email
            profileData.email.split('@')[0] // From name derived from email
          );
          
          if (clientEmailed) {
            updates.client_emailed_at = new Date().toISOString();
            console.log(`Client emailed for reminder ${reminder.id}`);
          }
        }

        // FIX 4: AUTO-COMPLETION LOGIC
        // Mark as done if:
        // - User has been notified AND
        // - Either client email not required OR client has been emailed
        const clientEmailRequired = reminder.send_client_email && clientEmail;
        const isComplete = userNotified && (!clientEmailRequired || clientEmailed);
        
        if (isComplete) {
          updates.status = 'done';
          updates.done_at = new Date().toISOString();
          console.log(`Reminder ${reminder.id} marked as DONE`);
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
          completed: isComplete,
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
