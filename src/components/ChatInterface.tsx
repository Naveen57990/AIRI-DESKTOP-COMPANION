import React, { useEffect, useRef, useState } from "react";
import { Send, Sparkles, RefreshCw, AlertCircle, HelpCircle, Check, Search, Quote } from "lucide-react";
import { ChatMessage, Emotion } from "../types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, useSearch: boolean) => void;
  loading: boolean;
  setEmotion: (emotion: any) => void;
  aiProvider?: "gemini" | "ollama";
  ollamaModel?: string;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  loading,
  setEmotion,
  aiProvider = "gemini",
  ollamaModel = "gemma2",
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState("");
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    onSendMessage(inputText.trim(), useSearch);
    setInputText("");
  };

  // Quick prompt commands
  const quickActions = [
    { label: "Design study schedule", prompt: "Airi, can you help me plan out a study schedule for my upcoming examinations this week?" },
    { label: "Summarize wave mechanics", prompt: "Airi, please summarize the core formulas and concepts behind Quantum Wave Mechanics." },
    { label: "What is your favorite topic?", prompt: "Airi, what is your absolute favorite subject to study with me?" },
  ];

  return (
    <div className="flex flex-col h-[520px] bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-pink/10 border border-brand-pink/20 text-brand-pink rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Interactive Vocal Intelligence</h3>
              <p className="text-xs text-white/60">
                {aiProvider === "ollama"
                  ? `Powered by Local Ollama (${ollamaModel})`
                  : "Powered by Gemini & Google Search Grounding"}
              </p>
            </div>
          </div>

          {/* Web Search Grounding toggle */}
          {aiProvider === "gemini" ? (
            <button
              type="button"
              onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                useSearch
                  ? "bg-brand-cyan/15 border-brand-cyan/40 text-brand-cyan"
                  : "bg-brand-black border-white/10 text-white/50 hover:bg-white/5"
              }`}
            >
              <Search className="h-3 w-3" />
              <span>Search Grounding</span>
            </button>
          ) : (
            <span className="text-[10px] font-mono font-semibold text-brand-cyan bg-brand-cyan/10 px-2.5 py-1 rounded-full border border-brand-cyan/20">
              ⚡ LOCAL OFFLINE
            </span>
          )}
        </div>

        {/* Conversation flow */}
        <div className="space-y-4 overflow-y-auto h-[320px] pr-1.5 scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-sans ${
                  msg.sender === "user"
                    ? "bg-brand-pink text-white rounded-tr-none shadow-md"
                    : "bg-brand-black border border-white/10 text-white/90 rounded-tl-none"
                }`}
              >
                <p>{msg.text}</p>

                {/* Grounding sources references */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-white/40 font-mono space-y-1.5">
                    <span className="font-bold text-white/60 flex items-center mb-1">
                      <Quote className="h-3 w-3 mr-1 text-brand-cyan" />
                      Web Grounding Citations:
                    </span>
                    {msg.sources.map((src, idx) => (
                      <div key={idx} className="truncate text-[10px] text-brand-cyan/80">
                        {src}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-white/40 font-mono mt-1.5 px-1">
                {msg.sender === "user" ? "Naveen" : "Airi"} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-white/40 text-xs italic">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-pink" />
              <span>Airi is drafting an answer...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div>
        {/* Quick Suggestions list */}
        {messages.length <= 1 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {quickActions.map((act, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => {
                  setEmotion("thinking");
                  onSendMessage(act.prompt, useSearch);
                }}
                className="px-2.5 py-1.5 bg-brand-black hover:bg-white/5 border border-white/10 hover:border-brand-pink/50 rounded-xl text-[10px] text-white/50 transition-colors cursor-pointer"
              >
                {act.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={loading ? "Awaiting reply..." : "Ask Airi to review papers, search the web..."}
            disabled={loading}
            className="flex-1 bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-pink disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-3 bg-brand-pink text-white rounded-xl hover:bg-brand-pink/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-md cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
