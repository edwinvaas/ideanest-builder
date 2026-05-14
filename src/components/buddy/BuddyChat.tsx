import { useState, useRef, useEffect, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { BuddyConfig } from "@/lib/buddyConfig";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface BuddyChatProps {
  config: BuddyConfig;
  welcome: string;
  /** Returns the request body sent to the chat edge function */
  buildRequestBody: (
    messages: { role: "user" | "assistant"; content: string }[],
  ) => Record<string, unknown>;
  /** Optional element rendered above the messages (e.g. coach class context) */
  contextSlot?: ReactNode;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const parseFollowups = (raw: string): { visible: string; followups: string[] } => {
  const closed = raw.match(/<followups>([\s\S]*?)<\/followups>/i);
  if (closed) {
    const visible = raw.replace(closed[0], "").trimEnd();
    const followups = closed[1]
      .split("\n")
      .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
      .filter((l) => l.length > 0 && l.length < 200);
    return { visible, followups };
  }
  const openIdx = raw.search(/<followups>/i);
  if (openIdx !== -1) {
    return { visible: raw.slice(0, openIdx).trimEnd(), followups: [] };
  }
  return { visible: raw, followups: [] };
};

export const BuddyChat = ({ config, welcome, buildRequestBody, contextSlot }: BuddyChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: welcome },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When the persona changes, reset the welcome message
  useEffect(() => {
    setMessages([{ id: "welcome", role: "assistant", content: welcome }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.persona]);

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

      const body = buildRequestBody(apiMessages);

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
          toast({ title: "Error", description: `Could not reach ${config.name}.`, variant: "destructive" });
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
      toast({ title: "Connection error", description: `Lost connection to ${config.name}.`, variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const Icon = config.icon;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-fire flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg truncate">{config.name}</h1>
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                {config.persona === "athlete" ? "Athlete buddy" : "Coach buddy"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{config.tagline}</p>
          </div>
        </div>
        {contextSlot}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6 max-w-3xl space-y-6">
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const { visible, followups } = msg.role === "assistant"
              ? parseFollowups(msg.content)
              : { visible: msg.content, followups: [] as string[] };
            const showFollowups =
              msg.role === "assistant" && isLast && !isStreaming && followups.length > 0;

            return (
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
                <div className="flex flex-col gap-3 max-w-[80%]">
                  <div className={`rounded-xl px-4 py-3 ${
                    msg.role === "assistant"
                      ? "bg-gradient-card border border-border"
                      : "bg-primary/10 border border-primary/20"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_strong]:text-foreground [&_strong]:font-semibold">
                        <ReactMarkdown>{visible || "…"}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                    )}
                  </div>

                  {showFollowups && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                        Suggested next questions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {followups.map((q) => (
                          <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            disabled={isStreaming}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/60 text-foreground hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/40 transition-colors text-left disabled:opacity-50"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

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

      {/* Initial suggestions */}
      {messages.length <= 1 && (
        <div className="container mx-auto px-6 max-w-3xl pb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            Try asking
          </p>
          <div className="flex flex-wrap gap-2">
            {config.initialSuggestions.map((q) => (
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
              placeholder={config.inputPlaceholder}
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
  );
};
