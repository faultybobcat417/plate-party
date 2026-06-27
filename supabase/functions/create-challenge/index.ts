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

    const { data, error } = await supabase.rpc("create_challenge_atomic", {
      p_title: body.title,
      p_description: body.description,
      p_reward_plates: body.rewardPlates,
      p_deadline: body.deadline,
      p_creator_id: session.user.id,
      p_proof_requirements: body.proofRequirements,
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
