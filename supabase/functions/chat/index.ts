const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AthleteProfile {
  name: string;
  age: number;
  gender: string;
  experience: string;
  box: string;
  goals: string[];
  benchmarks: Record<string, string>;
  maxLifts: Record<string, number>;
  gymnastics: Record<string, number>;
}

const buildSystemPrompt = (profile: AthleteProfile) => `You are an elite CrossFit coach and AI training buddy. You give personalized, actionable advice based on the athlete's profile and benchmark data. Be concise, motivating, and practical. Use markdown formatting (bold, lists) and emojis where appropriate.

ATHLETE PROFILE:
- Name: ${profile.name}
- Age: ${profile.age} | Gender: ${profile.gender}
- Experience: ${profile.experience}
- Box: ${profile.box}
- Goals: ${profile.goals?.join(", ") || "general fitness"}

BENCHMARK WODs:
- Fran: ${profile.benchmarks?.fran || "N/A"}
- Grace: ${profile.benchmarks?.grace || "N/A"}
- Murph: ${profile.benchmarks?.murph || "N/A"}
- Helen: ${profile.benchmarks?.helen || "N/A"}
- Diane: ${profile.benchmarks?.diane || "N/A"}

MAX LIFTS (kg):
- Back Squat: ${profile.maxLifts?.backSquat}
- Deadlift: ${profile.maxLifts?.deadlift}
- Clean & Jerk: ${profile.maxLifts?.cleanAndJerk}
- Snatch: ${profile.maxLifts?.snatch}
- Strict Press: ${profile.maxLifts?.strictPress}

GYMNASTICS (max unbroken):
- Pull-ups: ${profile.gymnastics?.maxPullups}
- HSPU: ${profile.gymnastics?.maxHSPU}
- Muscle-ups: ${profile.gymnastics?.maxMuscleUps}
- Double-unders: ${profile.gymnastics?.maxDoubleUnders}

Always reference specific numbers from this profile when giving advice. If asked for a program, give concrete sets/reps with weights based on their maxes (e.g., percentages of their actual lifts). Identify limiters honestly.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = profile
      ? buildSystemPrompt(profile)
      : "You are a helpful CrossFit coach AI assistant.";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
