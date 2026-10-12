import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SERVICE_ID = "service_7t0p3zw";
const TEMPLATE_ID = "template_2zazhvj";
const TEST_SITE_URL = "https://naileditby-gel.github.io/Naileditby_gel_Test";
const EMAILJS_PUBLIC_KEY = Deno.env.get("EMAILJS_PUBLIC_KEY") || "";
const EMAILJS_PRIVATE_KEY = Deno.env.get("EMAILJS_PRIVATE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://naileditby-gel.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function prettyTime(value: string | null) {
  if (!value) return "";
  const parts = value.slice(0, 5).split(":");
  if (parts.length !== 2) return value;
  const hour = Number(parts[0]);
  const minute = parts[1];
  return (hour % 12 || 12) + ":" + minute + (hour >= 12 ? " PM" : " AM");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { success: false, error: "Method not allowed." });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return reply(401, { success: false, error: "Please log in as the owner first." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
    return reply(500, { success: false, error: "Email notification setup is incomplete. Please finish the TEST project configuration." });
  }

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return reply(401, { success: false, error: "Your owner session is invalid. Please log in again." });

    const { data: isOwner, error: ownerError } = await userClient.rpc("is_nailedit_owner");
    if (ownerError || isOwner !== true) return reply(403, { success: false, error: "Owner access is required to send booking emails." });

    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body.booking_id === "string" ? body.booking_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
      return reply(400, { success: false, error: "A valid booking ID is required." });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .select("id,name,customer_email,appointment_date,appointment_time,service,status,total_design_price,deposit_amount,customer_message,access_token")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) return reply(404, { success: false, error: "Booking not found." });
    if (!booking.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customer_email)) {
      return reply(400, { success: false, error: "This booking has no valid customer email. Ask the customer to update their booking details." });
    }

    const total = Number(booking.total_design_price || 0);
    const deposit = Number(booking.deposit_amount || 0);
    const remaining = Math.max(0, total - deposit);
    const statusUrl = TEST_SITE_URL.replace(/\/$/, "") + "/booking-status.html?token=" + encodeURIComponent(booking.access_token);
    const params = {
      email: booking.customer_email,
      customer_name: booking.name || "there",
      appointment_date: booking.appointment_date || "",
      appointment_time: prettyTime(booking.appointment_time),
      service_name: booking.service || "Nail appointment",
      total_price: total.toFixed(2),
      deposit_amount: deposit.toFixed(2),
      remaining_balance: remaining.toFixed(2),
      booking_status: booking.status || "pending",
      owner_message: booking.customer_message || "Thank you for booking with Naileditby_gel! 💗",
      booking_link: statusUrl,
    };

    const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: params,
      }),
    });

    if (!emailResponse.ok) {
      const detail = (await emailResponse.text()).slice(0, 500);
      console.error("EmailJS send failed:", emailResponse.status, detail);
      return reply(502, { success: false, error: "EmailJS rejected the request: " + detail });
    }

    return reply(200, { success: true, message: "Booking email sent." });
  } catch (error) {
    console.error("send-booking-email error:", error);
    return reply(500, { success: false, error: "An unexpected error occurred while sending the email." });
  }
});
