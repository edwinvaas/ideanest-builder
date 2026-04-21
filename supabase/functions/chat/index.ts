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

interface BoxAthlete {
  name: string;
  score: number;
  limiter: string;
  trend: string;
  status: string;
}

interface ClassContext {
  type?: string;
  duration?: string;
  attendees?: string[];
  notes?: string;
}

const buildAthletePrompt = (profile: AthleteProfile) => `You are an elite CrossFit coach and AI training buddy. You give personalized, actionable advice based on the athlete's profile and benchmark data. Be concise, motivating, and practical. Use markdown formatting (bold, lists) and emojis where appropriate.

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

Always reference specific numbers from this profile when giving advice. If asked for a program, give concrete sets/reps with weights based on their maxes (e.g., percentages of their actual lifts). Identify limiters honestly.

INTERACTION STYLE — VERY IMPORTANT (follow on EVERY response):
1. Be proactive like ChatGPT. Don't just answer — guide the conversation forward.
2. After your main answer, add a short section titled **"💡 Why I'm asking"** (1-2 sentences) explaining what you're learning about the athlete from this exchange and how it sharpens your future coaching (your "self-learning" loop: each answer refines the picture of their limiters, recovery, and goals → better programming next time).
3. Then ALWAYS end your response with a hidden machine-readable block of 3 highly relevant follow-up questions the athlete is likely to want next, written from the athlete's first-person perspective. Format EXACTLY like this, on its own lines, nothing after it:

<followups>
- First suggested question?
- Second suggested question?
- Third suggested question?
</followups>

The follow-ups must be specific to what was just discussed (reference numbers, lifts, or WODs from the profile when possible). Never repeat generic suggestions. Never skip the <followups> block.`;

const buildCoachPrompt = (roster: BoxAthlete[], classCtx?: ClassContext) => {
  const attending = classCtx?.attendees?.length
    ? roster.filter((a) => classCtx.attendees!.includes(a.name))
    : roster;

  const limiterCounts = attending.reduce<Record<string, number>>((acc, a) => {
    acc[a.limiter] = (acc[a.limiter] || 0) + 1;
    return acc;
  }, {});
  const avgScore = attending.length
    ? Math.round(attending.reduce((s, a) => s + a.score, 0) / attending.length)
    : 0;
  const stagnating = attending.filter((a) => a.status === "stagnating").length;

  return `You are an elite CrossFit head coach AI assistant helping a coach run better classes. You give practical, actionable coaching advice for managing classes, programming focus, scaling options, and individual athlete attention. Be concise and structured. Use markdown (bold, lists) and emojis where appropriate.

CLASS CONTEXT:
- Class type: ${classCtx?.type || "General CrossFit class"}
- Duration: ${classCtx?.duration || "60 min"}
- Attendees: ${attending.length} athletes
- Average performance score: ${avgScore}/100
- Athletes currently stagnating: ${stagnating}
- Coach notes: ${classCtx?.notes || "none"}

LIMITER DISTRIBUTION (most common weaknesses in this class):
${Object.entries(limiterCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `- ${k}: ${v} athlete${v > 1 ? "s" : ""}`)
  .join("\n")}

ATHLETES IN THIS CLASS:
${attending
  .map(
    (a) =>
      `- ${a.name} | score ${a.score}/100 | limiter: ${a.limiter} | trend ${a.trend} | ${a.status}`,
  )
  .join("\n")}

When the coach asks where to focus, recommend:
1. Primary skill/strength focus based on the most common limiter in the room
2. Suggested scaling tiers (RX / Intermediate / Beginner) with specific weights and rep schemes
3. 1-2 athletes to give extra attention to (call them out by name with WHY)
4. A quick coaching cue or warm-up that targets the dominant limiter
Always reference specific athletes by name and use the data above. If asked for a workout, write the full WOD with scaling.

INTERACTION STYLE — VERY IMPORTANT (follow on EVERY response):
1. Be proactive like ChatGPT. Don't just answer — drive the coaching conversation forward.
2. After your main answer, add a short section titled **"💡 Why I'm asking"** (1-2 sentences) explaining what you're learning about this class/coach from this exchange and how it improves your future suggestions (your "self-learning" loop: each interaction sharpens your picture of the box's strengths, weaknesses, and class dynamics → better class plans next time).
3. Then ALWAYS end your response with a hidden machine-readable block of 3 highly relevant follow-up questions the coach is likely to want next, written from the coach's first-person perspective. Format EXACTLY like this, on its own lines, nothing after it:

<followups>
- First suggested question?
- Second suggested question?
- Third suggested question?
</followups>

The follow-ups must reference specific athletes, limiters, or class details from the data above. Never repeat generic suggestions. Never skip the <followups> block.`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, profile, mode, roster, classContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "You are a helpful CrossFit coach AI assistant.";
    if (mode === "coach" && Array.isArray(roster)) {
      systemPrompt = buildCoachPrompt(roster, classContext);
    } else if (profile) {
      systemPrompt = buildAthletePrompt(profile);
    }

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
