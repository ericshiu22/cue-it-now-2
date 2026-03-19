import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Beehiiv: Add subscriber ─────────────────────────────────────────────────
async function addToBeehiiv(
  email: string,
  milestoneType: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("Beehiiv1"); // API Key
  const pubId = Deno.env.get("Beehiiv2");  // Publication ID

  if (!apiKey || !pubId) {
    console.warn("[BEEHIIV] Missing Beehiiv1 (API key) or Beehiiv2 (pub ID)");
    return { success: false, error: "missing_credentials" };
  }

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: milestoneType === "welcome",
          custom_fields: [
            { name: "milestone", value: milestoneType },
            { name: "source", value: "cue_it_app" },
          ],
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("[BEEHIIV] API error:", data);
      return { success: false, error: JSON.stringify(data) };
    }

    console.log("[BEEHIIV] Subscriber added:", email, "milestone:", milestoneType);
    return { success: true };
  } catch (err) {
    console.error("[BEEHIIV] Failed:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Resend: Send milestone email ────────────────────────────────────────────
async function sendMilestoneEmail(
  email: string,
  milestoneType: string
): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[EMAIL] RESEND_API_KEY not configured, skipping email");
    return false;
  }

  const templates: Record<string, { subject: string; body: string }> = {
    welcome: {
      subject: "Welcome to Cue It!",
      body: `You're in! Cue It helps you manage your streaming subscriptions, discover what to watch, and save money on services you're not using.<br><br>Complete your profile setup to get personalized recommendations and connect with friends.`,
    },
    onboarding_complete: {
      subject: "You're all set up on Cue It!",
      body: `Your profile is ready. Here's what you can do now:<br><br>• <strong>Add shows</strong> to your queue and track what you're watching<br>• <strong>Connect with friends</strong> to see what they're binging<br>• <strong>Get smart alerts</strong> when it's time to swap or cancel a service<br><br>We'll also keep you in the loop with our newsletter — curated streaming tips and savings strategies.`,
    },
  };

  const template = templates[milestoneType];
  if (!template) {
    console.warn("[EMAIL] No template for milestone:", milestoneType);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cue It <notifications@resend.dev>",
        to: [email],
        subject: template.subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#1a1a2e;margin-bottom:8px;">${template.subject}</h2>
          <p style="color:#555;line-height:1.6;">${template.body}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#999;font-size:12px;">Sent by Cue It &bull; Manage preferences in your profile settings</p>
        </div>`,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[EMAIL] Resend error:", data);
      return false;
    }
    console.log("[EMAIL] Milestone email sent to", email, "id:", data.id);
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed:", err);
    return false;
  }
}

// ─── GA4: Server-side event via Measurement Protocol ─────────────────────────
async function trackGA4Event(
  userId: string,
  milestoneType: string
): Promise<boolean> {
  const measurementId = Deno.env.get("GA4_MEASUREMENT_ID") || "G-6HDKF9CQ5Y";
  const apiSecret = Deno.env.get("GA4_API_SECRET");

  if (!apiSecret) {
    console.warn("[GA4] GA4_API_SECRET not configured, skipping server-side tracking");
    return false;
  }

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: userId,
          events: [
            {
              name: `milestone_${milestoneType}`,
              params: {
                milestone_type: milestoneType,
                source: "edge_function",
              },
            },
          ],
        }),
      }
    );

    // GA4 Measurement Protocol returns 204 on success with no body
    if (res.status === 204 || res.ok) {
      console.log("[GA4] Event tracked:", `milestone_${milestoneType}`, "user:", userId);
      return true;
    }

    console.error("[GA4] Unexpected status:", res.status);
    return false;
  } catch (err) {
    console.error("[GA4] Failed:", err);
    return false;
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the calling user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the JWT to get user ID
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const milestoneType: string = body.milestone_type;

    if (!milestoneType || !["welcome", "onboarding_complete"].includes(milestoneType)) {
      return new Response(
        JSON.stringify({ error: "Invalid milestone_type. Must be 'welcome' or 'onboarding_complete'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if milestone already recorded (prevent duplicates)
    const { data: existing } = await supabase
      .from("milestone_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("milestone_type", milestoneType)
      .maybeSingle();

    if (existing) {
      console.log(`[MILESTONE] Already recorded ${milestoneType} for user ${user.id}, skipping`);
      return new Response(
        JSON.stringify({ status: "already_recorded", milestone_type: milestoneType }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", user.id)
      .maybeSingle();

    const email = profile?.email || user.email;
    if (!email) {
      return new Response(
        JSON.stringify({ error: "No email found for user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute all three integrations in parallel
    const [beehiivResult, emailSent, ga4Tracked] = await Promise.all([
      addToBeehiiv(email, milestoneType),
      sendMilestoneEmail(email, milestoneType),
      trackGA4Event(user.id, milestoneType),
    ]);

    // Record the milestone event
    const { error: insertError } = await supabase
      .from("milestone_events")
      .insert({
        user_id: user.id,
        milestone_type: milestoneType,
        beehiiv_synced: beehiivResult.success,
        email_sent: emailSent,
        ga4_tracked: ga4Tracked,
        metadata: {
          email,
          beehiiv_error: beehiivResult.error || null,
          timestamp: new Date().toISOString(),
        },
      });

    if (insertError) {
      console.error("[MILESTONE] Failed to record:", insertError);
    }

    console.log(
      `[MILESTONE] ${milestoneType} for ${email}: beehiiv=${beehiivResult.success} email=${emailSent} ga4=${ga4Tracked}`
    );

    return new Response(
      JSON.stringify({
        status: "processed",
        milestone_type: milestoneType,
        beehiiv_synced: beehiivResult.success,
        email_sent: emailSent,
        ga4_tracked: ga4Tracked,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("milestone-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
