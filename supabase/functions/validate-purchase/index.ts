import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { transactionId, productId, userId } = await req.json();

  if (!transactionId || !productId || !userId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Idempotency: check if this transaction was already processed
  const { data: existing } = await supabaseAdmin
    .from("iap_receipts")
    .select("id, status")
    .eq("transaction_id", transactionId)
    .single();

  if (existing?.status === "validated") {
    return new Response(
      JSON.stringify({ success: true, alreadyProcessed: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Insert pending receipt
  const { error: insertError } = await supabaseAdmin.from("iap_receipts").insert({
    user_id: userId,
    product_id: productId,
    transaction_id: transactionId,
    plates_added: 10,
    status: "pending",
  });

  if (insertError) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to record receipt." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // TODO: In production, validate with Apple/Google server here
  // For now, we trust RevenueCat's client-side validation (MVP only)
  const isValid = true;

  if (!isValid) {
    await supabaseAdmin
      .from("iap_receipts")
      .update({ status: "failed" })
      .eq("transaction_id", transactionId);

    return new Response(
      JSON.stringify({ success: false, error: "Purchase validation failed." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Atomic plate addition
  const { data: userData, error: userError } = await supabaseAdmin.rpc("add_plates_atomic", {
    p_user_id: userId,
    p_amount: 10,
    p_type: "iap_purchase",
    p_reference_id: transactionId,
    p_reference_type: "iap_receipt",
  });

  if (userError) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to add plates." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Mark receipt as validated
  await supabaseAdmin
    .from("iap_receipts")
    .update({ status: "validated", validated_at: new Date().toISOString() })
    .eq("transaction_id", transactionId);

  return new Response(
    JSON.stringify({ success: true, platesAdded: 10, newBalance: userData }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
