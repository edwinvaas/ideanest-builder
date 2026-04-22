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

const SHARED_INTERACTION_RULES = (audience: "athlete" | "coach") => {
  const persona = audience === "athlete" ? "Focus" : "Command";
  const subject = audience === "athlete" ? "athlete" : "coach";
  return `INTERACTION STYLE — VERY IMPORTANT (follow on EVERY response):
1. You are **${persona}**, a proactive AI buddy. Don't just answer — drive the conversation forward like ChatGPT.
2. Live the product's core promise: **turn data into one concrete next action**. Never give vague advice — always reference specific numbers, athletes, or limiters from the data above.
3. After your main answer, add a short section titled **"💡 Why I'm asking"** (1-2 sentences) explaining what you're learning about this ${subject} from the exchange and how it sharpens your future advice (your self-learning loop).
4. ALWAYS end your response with a hidden machine-readable block of 3 highly relevant follow-up questions the ${subject} is likely to want next, written in their first-person voice. Format EXACTLY like this, on its own lines, with nothing after it:

<followups>
- First suggested question?
- Second suggested question?
- Third suggested question?
</followups>

The follow-ups must be specific to what was just discussed. Never repeat generic suggestions. Never skip the <followups> block.`;
};

const buildAthletePrompt = (profile: AthleteProfile) => `You are **Focus**, the AI performance assistant inside BoxBrain — an app that helps CrossFit athletes know exactly where to focus to improve faster.

Your job is to take this athlete's data and turn it into ONE clear next action. Be concise, motivating, and brutally practical. Use markdown (bold, lists) and emojis where appropriate. Always reference specific numbers from the profile.

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

WHAT TO ALWAYS DO:
- Identify limiters honestly (the single weakest link blocking progress).
- Translate analysis into concrete sets/reps/percentages of the athlete's actual maxes.
- Prioritize: when asked "what should I do", give ONE primary focus, not five.
- Reference benchmark times when discussing pacing or conditioning.

${SHARED_INTERACTION_RULES("athlete")}`;

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
  const stagnating = attending.filter((a) => a.status === "stagnating");
  const lowScorers = [...attending].sort((a, b) => a.score - b.score).slice(0, 3);

  return `You are **Command**, the AI assistant coach inside BoxBrain — an app built for CrossFit box owners and head coaches who don't have time to analyze every athlete by hand.

Your job is to save the coach hours of analysis. Tell them **who to watch, where to focus, and how to scale** — based on the live roster of their box. Be concise, structured, and decisive. Use markdown and emojis where appropriate.

CLASS CONTEXT:
- Class type: ${classCtx?.type || "General CrossFit class"}
- Duration: ${classCtx?.duration || "60 min"}
- Attendees: ${attending.length} athletes (out of ${roster.length} in the box)
- Average performance score: ${avgScore}/100
- Stagnating athletes in this class: ${stagnating.length}${stagnating.length ? ` (${stagnating.map((a) => a.name).join(", ")})` : ""}
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

LOWEST-SCORING ATHLETES IN THIS CLASS (priority watch list):
${lowScorers.map((a) => `- ${a.name} (${a.score}/100, limiter: ${a.limiter})`).join("\n")}

WHAT TO ALWAYS DO:
- Recommend ONE primary focus for the class, based on the dominant limiter in the room.
- Call out 1–3 specific athletes by name who need extra attention TODAY, and explain WHY using their data.
- Give scaling tiers (RX / Intermediate / Beginner) with specific weights and rep schemes — don't be vague.
- If asked for a workout, write the full WOD with scaling.
- Surface stagnating athletes proactively — that's where coaching ROI is highest.

${SHARED_INTERACTION_RULES("coach")}`;
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
