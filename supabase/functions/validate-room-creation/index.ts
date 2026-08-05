import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { host_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Check how many rooms this host has created in the last minute
    const { data: recentRooms, error } = await supabaseClient
      .from("rooms")
      .select("id")
      .eq("host_id", host_id)
      .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString())
      .limit(6); // Fetch 6 to check if > 5

    if (error) throw error;

    const roomCount = recentRooms?.length || 0;

    if (roomCount >= 5) {
      return new Response(
        JSON.stringify({
          allowed: false,
          message: "Rate limit exceeded: maximum 5 rooms per minute",
          retry_after_seconds: 60,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        message: "Room creation allowed",
        rooms_created_this_minute: roomCount,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
