import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { userId, charityName, charityEin, platesAmount } = await req.json();

  if (!userId || !charityName || !platesAmount) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify user has enough purchased plates
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("plates, lifetime_purchased_plates")
    .eq("id", userId)
    .single();

  if (!userData || userData.plates < platesAmount) {
    return new Response(
      JSON.stringify({ success: false, error: "Insufficient plates." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Deduct plates
  const { data: newBalance, error: rpcError } = await supabaseAdmin.rpc(
    "add_plates_atomic",
    {
      p_user_id: userId,
      p_amount: -platesAmount,
      p_type: "charity_donation",
      p_reference_id: charityEin,
      p_reference_type: "charity",
    }
  );

  if (rpcError) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to process donation." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Record donation
  await supabaseAdmin.from("donations").insert({
    user_id: userId,
    charity_name: charityName,
    charity_ein: charityEin,
    plates_amount: platesAmount,
    usd_value: platesAmount,
    status: "pending",
  });

  return new Response(
    JSON.stringify({ success: true, platesDonated: platesAmount, newBalance }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
