import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles, Dumbbell, Users } from "lucide-react";
import { useAthlete } from "@/contexts/AthleteContext";
import { toast } from "@/hooks/use-toast";
import { boxAthletes } from "@/data/athletes";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type Mode = "athlete" | "coach";

const athleteSuggestions = [
  "What should I focus on this week?",
  "How can I improve my Fran time?",
  "Create a strength program for me",
  "What's limiting my performance?",
];

const coachSuggestions = [
  "Where should I focus today's class?",
  "Which athletes need extra attention?",
  "Suggest scaling options for today's WOD",
  "Design a class targeting our top limiter",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const buildWelcome = (mode: Mode, name: string) =>
  mode === "athlete"
    ? `Hey ${name || "Athlete"}! 👋 I'm your AI training buddy. I know your profile, benchmarks, and performance data. Ask me anything about your training — from workout strategy to identifying your limiters. What would you like to work on?`
    : `Hey Coach! 👋 I've got the full roster of your box loaded — ${boxAthletes.length} athletes with their scores, limiters, and trends. Tell me about today's class (type, focus, who's attending) and I'll help you decide where to put the focus, which athletes to watch, and how to scale.`;

const AIChatPage = () => {
  const { profile } = useAthlete();
  const [mode, setMode] = useState<Mode>("athlete");
  const [classType, setClassType] = useState("Conditioning + Strength");
  const [classDuration, setClassDuration] = useState("60 min");
  const [classNotes, setClassNotes] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: buildWelcome("athlete", profile.name) },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const switchMode = (next: Mode) => {
    if (next === mode || isStreaming) return;
    setMode(next);
    setMessages([
      { id: "welcome", role: "assistant", content: buildWelcome(next, profile.name) },
    ]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) {
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m,
          );
        }
        return [...prev, { id: assistantId, role: "assistant", content: assistantContent }];
      });
    };

    try {
      const apiMessages = history
        .filter((m) => m.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));

      const body =
        mode === "athlete"
          ? { messages: apiMessages, mode, profile }
          : {
              messages: apiMessages,
              mode,
              roster: boxAthletes,
              classContext: {
                type: classType,
                duration: classDuration,
                notes: classNotes,
              },
            };

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast({ title: "Rate limit", description: "Too many requests, please wait a moment.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "Credits exhausted", description: "Please add AI credits to your workspace.", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Could not reach AI buddy.", variant: "destructive" });
        }
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(delta);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(delta);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
      toast({ title: "Connection error", description: "Lost connection to AI buddy.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const suggestions = mode === "athlete" ? athleteSuggestions : coachSuggestions;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex flex-col">
        <div className="border-b border-border bg-gradient-card">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-fire flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg">AI Training Buddy</h1>
                <p className="text-xs text-muted-foreground">
                  {mode === "athlete"
                    ? "Personalized coaching powered by your data"
                    : "Class management coach for your box"}
                </p>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="inline-flex items-center bg-secondary rounded-lg p-1 border border-border self-start md:self-auto">
              <button
                onClick={() => switchMode("athlete")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  mode === "athlete"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                Athlete
              </button>
              <button
                onClick={() => switchMode("coach")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  mode === "coach"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Users className="w-3.5 h-3.5" />
                Coach
              </button>
            </div>
          </div>

          {/* Coach class context */}
          {mode === "coach" && (
            <div className="border-t border-border bg-background/40">
              <div className="container mx-auto px-6 py-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Class type</label>
                  <Input
                    value={classType}
                    onChange={(e) => setClassType(e.target.value)}
                    placeholder="e.g. Strength + Metcon"
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Duration</label>
                  <Input
                    value={classDuration}
                    onChange={(e) => setClassDuration(e.target.value)}
                    placeholder="60 min"
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notes</label>
                  <Input
                    value={classNotes}
                    onChange={(e) => setClassNotes(e.target.value)}
                    placeholder="e.g. open gym, comp prep, beginners present"
                    className="h-8 text-sm mt-1"
                  />
                </div>
              </div>
            </div>
          )}
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
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_strong]:text-foreground [&_strong]:font-semibold">
                      <ReactMarkdown>{msg.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
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
              {suggestions.map((q) => (
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
                placeholder={mode === "athlete" ? "Ask about your training..." : "Ask about your class..."}
                className="flex-1"
                disabled={isStreaming}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isStreaming}
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
