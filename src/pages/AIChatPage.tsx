import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useAthlete } from "@/contexts/AthleteContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "What should I focus on this week?",
  "How can I improve my Fran time?",
  "Create a strength program for me",
  "What's limiting my performance?",
];

const generateAIResponse = (userMessage: string, profile: ReturnType<typeof useAthlete>["profile"]): string => {
  const msg = userMessage.toLowerCase();

  if (msg.includes("focus") || msg.includes("priority")) {
    return `Based on your profile, ${profile.name}, your primary limiter is **Gymnastics** (especially muscle-ups at ${profile.gymnastics.maxMuscleUps} reps and HSPUs at ${profile.gymnastics.maxHSPU} reps). I recommend:\n\n1. **3x/week strict pulling work** — 4x6 strict pull-ups, 3x8 ring rows\n2. **2x/week HSPU progressions** — pike push-ups → wall walks → negatives\n3. **Daily 5-min skill practice** — kipping drills or double under practice (currently at ${profile.gymnastics.maxDoubleUnders})\n\nThis should be your #1 focus for the next 4-6 weeks before moving to your secondary limiter (Mobility).`;
  }

  if (msg.includes("fran") || msg.includes("time")) {
    const franTime = profile.benchmarks.fran || "unknown";
    return `Your current Fran time is **${franTime}**. To improve it:\n\n1. **Thrusters**: Your clean & jerk is ${profile.maxLifts.cleanAndJerk}kg — the 43kg thruster should feel light. Focus on cycling speed with 3x15 light thrusters for time.\n2. **Pull-ups**: With ${profile.gymnastics.maxPullups} unbroken, you need sets of 21-15-9 without breaking. Work on kipping efficiency.\n3. **Strategy**: Go unbroken on the 21s, break the 15s into 8-7, send the 9s.\n\n🎯 Predicted improvement in 8 weeks: **-25 to -40 seconds**`;
  }

  if (msg.includes("strength") || msg.includes("program")) {
    return `Here's a personalized strength block based on your numbers:\n\n**Back Squat** (current: ${profile.maxLifts.backSquat}kg)\n- Week 1-3: 5x5 @ 75% (${Math.round(profile.maxLifts.backSquat * 0.75)}kg)\n- Week 4-6: 5x3 @ 85% (${Math.round(profile.maxLifts.backSquat * 0.85)}kg)\n\n**Deadlift** (current: ${profile.maxLifts.deadlift}kg)\n- Week 1-3: 5x5 @ 70% (${Math.round(profile.maxLifts.deadlift * 0.7)}kg)\n- Week 4-6: 5x3 @ 82% (${Math.round(profile.maxLifts.deadlift * 0.82)}kg)\n\n**Clean & Jerk** (current: ${profile.maxLifts.cleanAndJerk}kg)\n- 3x/week technique work at 60-70%\n\n📈 Expected 1RM gains in 6 weeks: **+5-8%**`;
  }

  if (msg.includes("limit") || msg.includes("weak")) {
    return `Let me break down your limiters, ${profile.name}:\n\n🔴 **Primary: Gymnastics** — Score: 45/100\n- Muscle-ups: ${profile.gymnastics.maxMuscleUps} (needs work)\n- HSPUs: ${profile.gymnastics.maxHSPU} (below average for ${profile.experience})\n- This is costing you the most time in metcons\n\n🟡 **Secondary: Mobility** — Score: 55/100\n- Affects your overhead positions and Olympic lifts\n- Your snatch (${profile.maxLifts.snatch}kg) is limited by position, not strength\n\n🟢 **Strength: Engine** — Score: 78/100\n- Your endurance is strong, keep maintaining with 1-2 long aerobic sessions/week`;
  }

  return `Great question! Based on your profile as a${profile.experience === "intermediate" ? "n" : ""} **${profile.experience}** athlete at **${profile.box}**, here are my thoughts:\n\nYour overall score is **72/100**, with your biggest opportunity in gymnastics. Your engine (78/100) and endurance are solid foundations.\n\nWant me to dive deeper into any specific area? I can help with:\n- 🏋️ Strength programming\n- 🤸 Gymnastics progressions\n- 🏃 Engine development\n- 📊 WOD strategy`;
};

const AIChatPage = () => {
  const { profile } = useAthlete();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hey ${profile.name || "Athlete"}! 👋 I'm your AI training buddy. I know your profile, benchmarks, and performance data. Ask me anything about your training — from workout strategy to identifying your limiters. What would you like to work on?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1500));

    const response = generateAIResponse(content, profile);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex flex-col">
        <div className="border-b border-border bg-gradient-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-fire flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg">AI Training Buddy</h1>
                <p className="text-xs text-muted-foreground">Personalized coaching powered by your data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-6 max-w-3xl space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"
                }`}>
                  {msg.role === "assistant" ? (
                    <Sparkles className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className={`rounded-xl px-4 py-3 max-w-[80%] ${
                  msg.role === "assistant"
                    ? "bg-gradient-card border border-border"
                    : "bg-primary/10 border border-primary/20"
                }`}>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="rounded-xl px-4 py-3 bg-gradient-card border border-border">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="container mx-auto px-6 max-w-3xl pb-4">
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 max-w-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-3"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your training..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-gradient-fire hover:opacity-90 px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
