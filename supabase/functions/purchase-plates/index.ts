import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const body = await req.json();
    const idempotencyKey = req.headers.get("x-idempotency-key") || crypto.randomUUID();

    // TODO: Add RevenueCat receipt validation here before calling RPC
    // const revCatValid = await validateWithRevenueCat(body.receipt);
    // if (!revCatValid) throw new Error("Invalid receipt");

    const { data, error } = await supabase.rpc("purchase_plates_atomic", {
      p_user_id: session.user.id,
      p_amount: body.amount,
      p_receipt_id: body.receiptId,
      p_platform: body.platform || "ios",
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
