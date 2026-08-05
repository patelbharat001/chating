import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Time threshold: 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Step 1: Delete stale rooms (no heartbeat in 2 hours)
    const { data: stalRooms, error: selectError } = await supabaseClient
      .from("rooms")
      .select("id, user_count")
      .lt("last_active", twoHoursAgo);

    if (selectError) throw selectError;

    let deletedCount = 0;
    if (stalRooms && stalRooms.length > 0) {
      const { error: deleteError } = await supabaseClient
        .from("rooms")
        .delete()
        .lt("last_active", twoHoursAgo);

      if (deleteError) throw deleteError;
      deletedCount = stalRooms.length;
      console.log(`Cleaned up ${deletedCount} stale rooms`);
    }

    // Step 2: Count active rooms and concurrent users
    const { data: activeRooms, error: activeError } = await supabaseClient
      .from("rooms")
      .select("id, user_count")
      .gte("last_active", twoHoursAgo);

    if (activeError) throw activeError;

    const activeRoomCount = activeRooms?.length || 0;
    const concurrentUsers = (activeRooms || []).reduce(
      (sum, room) => sum + (room.user_count || 1),
      0
    );

    // Step 3: Record statistics
    const { error: statsError } = await supabaseClient
      .from("room_stats")
      .insert({
        active_rooms: activeRoomCount,
        concurrent_users: concurrentUsers,
        deleted_stale_rooms: deletedCount,
        recorded_at: new Date().toISOString(),
      });

    if (statsError) throw statsError;

    console.log(`Stats recorded: ${activeRoomCount} rooms, ${concurrentUsers} users`);

    return new Response(
      JSON.stringify({
        success: true,
        cleaned: deletedCount,
        activeRooms: activeRoomCount,
        concurrentUsers: concurrentUsers,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Cleanup and stats error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
