import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { itinerary, title } = await req.json();

    if (!itinerary || !itinerary.legs) {
      return new Response(
        JSON.stringify({ error: "Invalid itinerary data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try up to 3 times to generate a unique code
    let shareCode = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      shareCode = generateShareCode();
      const { data: existing } = await supabase
        .from("shared_trips")
        .select("id")
        .eq("share_code", shareCode)
        .maybeSingle();
      if (!existing) break;
    }

    const { data, error } = await supabase
      .from("shared_trips")
      .insert({
        share_code: shareCode,
        title: title || itinerary.title || "Shared Trip",
        itinerary_data: itinerary,
      })
      .select("share_code")
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ shareCode: data.share_code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
