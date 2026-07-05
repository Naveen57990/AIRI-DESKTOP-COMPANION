import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Calendar,
  Database,
  Terminal,
  Brain,
  MessageCircle,
  Clock,
  Volume2,
  Gamepad2,
  Tv,
  Cpu,
  Settings,
} from "lucide-react";
import { Emotion, ChatMessage, DistractionLog } from "./types";
import AiriCharacter from "./components/AiriCharacter";
import StudyDashboard from "./components/StudyDashboard";
import VisionSystem from "./components/VisionSystem";
import VoiceAssistant from "./components/VoiceAssistant";
import ChatInterface from "./components/ChatInterface";
import MemoryDashboard from "./components/MemoryDashboard";
import CalendarScheduler from "./components/CalendarScheduler";
import CodebaseDownloader from "./components/CodebaseDownloader";
import PDFHub from "./components/PDFHub";

export default function App() {
  const [activeTab, setActiveTab] = useState<"study" | "chat" | "memory" | "pdf" | "calendar" | "download">("study");
  const [emotion, setEmotion] = useState<Emotion>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "te">("te"); // Telugu as default female companion voice requested!

  // Ollama integration states
  const [aiProvider, setAiProvider] = useState<"gemini" | "ollama">(() => {
    return (localStorage.getItem("airi_ai_provider") as "gemini" | "ollama") || "gemini";
  });
  const [ollamaUrl, setOllamaUrl] = useState<string>(() => {
    return localStorage.getItem("airi_ollama_url") || "http://localhost:11434";
  });
  const [ollamaModel, setOllamaModel] = useState<string>(() => {
    return localStorage.getItem("airi_ollama_model") || "gemma2";
  });

  useEffect(() => {
    localStorage.setItem("airi_ai_provider", aiProvider);
  }, [aiProvider]);

  useEffect(() => {
    localStorage.setItem("airi_ollama_url", ollamaUrl);
  }, [ollamaUrl]);

  useEffect(() => {
    localStorage.setItem("airi_ollama_model", ollamaModel);
  }, [ollamaModel]);

  const [showEngineSettings, setShowEngineSettings] = useState(false);

  // Chat message state (starts with Airi greeting Naveen)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "airi",
      text: "Hello, Naveen! I am Airi, your personal desktop AI companion and study coach. Let's make this study session super productive! You can chat with me, upload notes to generate cards, or turn on 'Study Mode' so I can monitor distractions.",
      timestamp: new Date(),
    },
  ]);

  // Distraction history
  const [distractionLogs, setDistractionLogs] = useState<DistractionLog[]>([
    {
      id: "1",
      time: "10:15 AM",
      type: "Phone Usage",
      duration: "45s",
      airiReaction: "Naveen, please put that smartphone away! You're in the middle of a study cycle!",
    },
  ]);

  // Setup TTS Synth Voices load trigger
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      };
    }
  }, []);

  // Anime speech synthesis helper (custom pitch / Samantha/google female voice)
  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error("Error cancelling SpeechSynthesis:", e);
    }

    // Remove markdown symbols from speech
    const cleanSpeech = text.replace(/[*#`_\-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (language === "te") {
      // Find a Telugu voice
      selectedVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("te-") ||
          v.lang.toLowerCase() === "te" ||
          v.name.toLowerCase().includes("telugu")
      );
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        // Fallback: Do not use an English voice (like Samantha) for Telugu text, as that causes silent failure.
        // Leaving voice undefined lets the browser select its default voice for te-IN (or fallback engine).
        utterance.lang = "te-IN";
      }
    } else {
      selectedVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("google us English")
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.lang = "en-US";
    }

    utterance.pitch = language === "te" ? 1.05 : 1.32; // Higher pitch for English, natural for Telugu voices
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance onerror:", event);
      setIsSpeaking(false);
    };

    // A small 150ms timeout ensures speech doesn't get cancelled/stuck by the previous cancel call in Chrome
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Failed to speak utterance:", err);
        setIsSpeaking(false);
      }
    }, 150);
  };

  // Add distraction logs caught by camera or screen
  const handleAddDistractionLog = (
    type: "Phone Usage" | "Social Media / Game" | "User Absence" | "Yawning / Fatigue" | "Other Person",
    comments: string
  ) => {
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newLog: DistractionLog = {
      id: Date.now().toString(),
      time: timeString,
      type,
      duration: "Active",
      airiReaction: comments,
    };

    setDistractionLogs((prev) => [newLog, ...prev]);
  };

  // Chat message submission handler
  const handleSendMessage = async (text: string, useSearch: boolean) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setEmotion("thinking");

    try {
      // Append prompt instruction to ensure anime companion identity
      let systemPrompt = `You are Airi, a cheerful, helpful, anime-style desktop assistant and study coach for a student named Naveen.
Keep your answers lively, supportive, and relatively concise (under 120 words). You can use simple markdown, code blocks, or tables if helpful. Speak directly to Naveen.`;

      if (language === "te") {
        systemPrompt += `\nCRITICAL: Naveen wants to communicate with you in Telugu (తెలుగు). Please respond entirely in Telugu language using beautiful Telugu script (or a natural Telugu-English bilingual mix, keeping technical terms like 'code', 'study', 'VS Code', 'GitHub' in English/transliterated if needed, but the core sentences must be in Telugu script so it can be read aloud in Telugu). Keep your tone cheerful, supportive, and anime-like!`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          systemPrompt,
          useSearch,
          aiProvider,
          ollamaUrl,
          ollamaModel,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      setLoading(false);

      const airiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "airi",
        text: data.text,
        timestamp: new Date(),
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, airiMsg]);
      setEmotion("happy");
      speakText(data.text);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setEmotion("sad");

      const errMsgText = aiProvider === "ollama"
        ? `Local Ollama error: ${err.message || err}. Make sure Ollama is active on ${ollamaUrl} and CORS is enabled!`
        : "My neural reasoning core seems slightly lagging, Naveen! But don't worry, my local tracking and schedule timers are still running smoothly!";

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "airi",
        text: errMsgText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Voice transcript input handler
  const handleVoiceTranscript = (text: string) => {
    handleSendMessage(text, false);
  };

  return (
    <div className="min-h-screen bg-brand-black text-white flex flex-col justify-between selection:bg-brand-pink/30 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-brand-violet rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-pink rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      {/* Floating Vertical Text Decoration */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 text-[10px] text-white/5 tracking-[1em] uppercase select-none pointer-events-none hidden xl:block">
        Artificial Intelligence Desktop Interface v2.5.0-Release
      </div>

      {/* Sleek Glass Header */}
      <header className="border-b border-white/10 bg-brand-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="relative h-9.5 w-9.5 rounded-xl bg-gradient-to-tr from-brand-pink to-brand-violet flex items-center justify-center shadow-lg shadow-brand-pink/20">
            <Sparkles className="h-5 w-5 text-brand-black" />
            <div className="absolute inset-0 rounded-xl bg-brand-pink blur-sm opacity-30 animate-pulse" />
          </div>
          <div className="flex items-baseline space-x-3">
            <div className="text-2xl font-black tracking-tighter italic text-white uppercase">AIRI<span className="text-brand-pink">.</span></div>
            <span className="hidden sm:inline-block text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Jarvis-Style Desktop Overlay // V2.5
            </span>
          </div>
        </div>

        {/* Dynamic State Info bar */}
        <div className="hidden sm:flex items-center space-x-4">
          {/* Language Switcher Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-full p-1 text-xs">
            <button
              onClick={() => {
                setLanguage("en");
                speakText("Language switched to English, Naveen! How can I help you today?");
              }}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                language === "en"
                  ? "bg-brand-pink text-brand-black shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setLanguage("te");
                speakText("భాష తెలుగులోకి మార్చబడింది, నవీన్! నేను మీకు ఏవిధంగా సహాయం చేయగలను?");
              }}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                language === "te"
                  ? "bg-brand-pink text-brand-black shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              తెలుగు
            </button>
          </div>

          {/* AI Engine Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowEngineSettings(!showEngineSettings)}
              className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <Cpu className={`h-3.5 w-3.5 ${aiProvider === "ollama" ? "text-brand-cyan animate-pulse" : "text-brand-pink"}`} />
              <span className="font-semibold">
                {aiProvider === "ollama" ? `Ollama (${ollamaModel})` : "Gemini AI"}
              </span>
              <Settings className="h-3 w-3 opacity-60 hover:opacity-100 transition-opacity" />
            </button>

            {showEngineSettings && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0c0d0e]/95 border border-white/10 rounded-2xl p-4.5 shadow-2xl backdrop-blur-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">
                    AI INFERENCE CONFIG
                  </span>
                  <button 
                    onClick={() => setShowEngineSettings(false)}
                    className="text-[10px] font-mono text-brand-pink hover:underline uppercase"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Provider Selection */}
                  <div>
                    <label className="text-[10px] font-mono text-white/50 block mb-1.5 uppercase tracking-wider">AI Inference Engine:</label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-lg border border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          setAiProvider("gemini");
                          speakText("Switched to Gemini cloud core, Naveen!");
                        }}
                        className={`py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                          aiProvider === "gemini"
                            ? "bg-brand-pink text-brand-black shadow"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        GEMINI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiProvider("ollama");
                          speakText("Switched to your local Ollama instance, Naveen!");
                        }}
                        className={`py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                          aiProvider === "ollama"
                            ? "bg-brand-cyan text-brand-black shadow"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        OLLAMA (LOCAL)
                      </button>
                    </div>
                  </div>

                  {aiProvider === "ollama" && (
                    <>
                      {/* Ollama Endpoint URL */}
                      <div>
                        <label className="text-[10px] font-mono text-white/50 block mb-1 uppercase tracking-wider">Ollama Endpoint URL:</label>
                        <input
                          type="text"
                          value={ollamaUrl}
                          onChange={(e) => setOllamaUrl(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="w-full bg-brand-black border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-brand-cyan placeholder-white/20 outline-none focus:border-brand-cyan"
                        />
                        <span className="text-[8px] font-mono text-white/30 block mt-1 leading-tight">
                          *Ensure OLLAMA_ORIGINS="*" is set when running Ollama so the browser isn't blocked by CORS!
                        </span>
                      </div>

                      {/* Ollama Model name */}
                      <div>
                        <label className="text-[10px] font-mono text-white/50 block mb-1 uppercase tracking-wider">Ollama Model Name:</label>
                        <select
                          value={["gemma2", "llama3", "llama3.1", "mistral", "phi3", "llava"].includes(ollamaModel) ? ollamaModel : "custom"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "custom") {
                              setOllamaModel(val);
                            } else {
                              setOllamaModel("");
                            }
                          }}
                          className="w-full bg-brand-black border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-mono text-brand-cyan outline-none cursor-pointer"
                        >
                          <option value="gemma2">gemma2 (Recommended)</option>
                          <option value="llama3">llama3</option>
                          <option value="llama3.1">llama3.1</option>
                          <option value="mistral">mistral</option>
                          <option value="phi3">phi3</option>
                          <option value="llava">llava (Multimodal)</option>
                          <option value="custom">Custom (Type below...)</option>
                        </select>
                        
                        {/* Custom model text override */}
                        {(!["gemma2", "llama3", "llama3.1", "mistral", "phi3", "llava"].includes(ollamaModel) || ollamaModel === "") && (
                          <input
                            type="text"
                            placeholder="Type custom pulled model name..."
                            value={ollamaModel}
                            onChange={(e) => setOllamaModel(e.target.value)}
                            className="mt-1.5 w-full bg-brand-black border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-brand-cyan placeholder-white/20 outline-none focus:border-brand-cyan animate-in fade-in"
                          />
                        )}
                      </div>
                    </>
                  )}
                  
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/5 text-[9px] font-mono text-white/40 leading-snug">
                    {aiProvider === "ollama" 
                      ? "⚡ Running locally through Ollama means 100% free, private, offline-capable completions with zero API exhaustion!"
                      : "☁️ Gemini core delivers ultra-fast multimodality & web-grounding, but is subject to standard API request quotas."}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/60">
            <Clock className="h-3.5 w-3.5 text-brand-pink" />
            <span>5-Day Streak</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/60">
            <Volume2 className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
            <span>{language === "te" ? "తెలుగు వాయిస్" : "Samantha Speech Synth"}</span>
          </div>
        </div>
      </header>

      {/* Main Core Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Interactive Gaze Panel (Static character projection) */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          
          {/* Avatar Projection box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl group">
            <span className="absolute top-4 left-4 text-[9px] font-mono text-brand-pink bg-brand-pink/10 border border-brand-pink/20 px-2 py-0.5 rounded-full uppercase">
              {emotion.toUpperCase()}
            </span>

            <AiriCharacter emotion={emotion} isSpeaking={isSpeaking} />

            <div className="mt-4.5 z-10">
              <h2 className="text-sm font-bold text-white">Airi Companion</h2>
              <p className="text-xs text-white/60 mt-1">Gaze tracking & lip-synced voice enabled</p>
            </div>

            {/* Quick manual triggers */}
            <div className="w-full grid grid-cols-3 gap-1.5 mt-5 pt-3 border-t border-white/10">
              <button
                onClick={() => setEmotion("happy")}
                className="py-1 bg-brand-black border border-white/10 rounded-lg text-[10px] font-mono text-brand-pink hover:border-brand-pink/50 transition-colors"
              >
                Smile
              </button>
              <button
                onClick={() => setEmotion("embarrassed")}
                className="py-1 bg-brand-black border border-white/10 rounded-lg text-[10px] font-mono text-brand-pink hover:border-brand-pink/50 transition-colors"
              >
                Blush
              </button>
              <button
                onClick={() => {
                  setEmotion("thinking");
                  speakText("Hmm... let me check my SQLite vector memory schemas for you, Naveen!");
                }}
                className="py-1 bg-brand-black border border-white/10 rounded-lg text-[10px] font-mono text-brand-pink hover:border-brand-pink/50 transition-colors"
              >
                Think
              </button>
            </div>
          </div>

          {/* Quick Sub-navigation tabs */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab("study")}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                activeTab === "study"
                  ? "bg-brand-pink/15 border-brand-pink text-white shadow-lg"
                  : "bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Clock className="h-4 w-4 text-brand-pink" />
              <span>Study Focus Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                activeTab === "chat"
                  ? "bg-brand-pink/15 border-brand-pink text-white shadow-lg"
                  : "bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <MessageCircle className="h-4 w-4 text-brand-pink" />
              <span>Interactive Chats</span>
            </button>

            <button
              onClick={() => setActiveTab("pdf")}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                activeTab === "pdf"
                  ? "bg-brand-pink/15 border-brand-pink text-white shadow-lg"
                  : "bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <BookOpen className="h-4 w-4 text-brand-pink" />
              <span>Study Notes Analyzer</span>
            </button>

            <button
              onClick={() => setActiveTab("memory")}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                activeTab === "memory"
                  ? "bg-brand-pink/15 border-brand-pink text-white shadow-lg"
                  : "bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Database className="h-4 w-4 text-brand-pink" />
              <span>Semantic Memory Search</span>
            </button>

            <button
              onClick={() => setActiveTab("calendar")}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                activeTab === "calendar"
                  ? "bg-brand-pink/15 border-brand-pink text-white shadow-lg"
                  : "bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Calendar className="h-4 w-4 text-brand-pink" />
              <span>Semester Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab("download")}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                activeTab === "download"
                  ? "bg-brand-pink/15 border-brand-pink text-white shadow-lg"
                  : "bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Terminal className="h-4 w-4 text-brand-pink" />
              <span>Native MacBook Code</span>
            </button>
          </div>
        </div>

        {/* Right Tab Content Render Area */}
        <div className="lg:col-span-9 space-y-6">
          {activeTab === "study" && (
            <div className="space-y-6">
              <StudyDashboard
                isStudyMode={isStudyMode}
                setIsStudyMode={setIsStudyMode}
                distractionLogs={distractionLogs}
                onAddDistractionLog={handleAddDistractionLog}
                speakText={speakText}
                setEmotion={setEmotion}
                language={language}
              />
              <VisionSystem
                isStudyMode={isStudyMode}
                onDistractionDetected={handleAddDistractionLog}
                emotion={emotion}
                setEmotion={setEmotion}
                speakText={speakText}
                language={language}
                aiProvider={aiProvider}
                ollamaUrl={ollamaUrl}
                ollamaModel={ollamaModel}
              />
            </div>
          )}

          {activeTab === "chat" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7">
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  loading={loading}
                  setEmotion={setEmotion}
                  aiProvider={aiProvider}
                  ollamaModel={ollamaModel}
                />
              </div>
              <div className="md:col-span-5">
                <VoiceAssistant
                  onTranscript={handleVoiceTranscript}
                  isSpeaking={isSpeaking}
                  setIsSpeaking={setIsSpeaking}
                  speakText={speakText}
                  language={language}
                />
              </div>
            </div>
          )}

          {activeTab === "pdf" && (
            <PDFHub
              aiProvider={aiProvider}
              ollamaUrl={ollamaUrl}
              ollamaModel={ollamaModel}
            />
          )}

          {activeTab === "memory" && <MemoryDashboard />}

          {activeTab === "calendar" && <CalendarScheduler />}

          {activeTab === "download" && <CodebaseDownloader />}
        </div>
      </main>

      {/* Footer disclaimer lines */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-4.5 px-6 text-center text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row sm:justify-between items-center gap-3">
        <span>AIRI COMPANION // SYSTEM DIAGNOSTIC OKAY</span>
        <span>DESIGNED FOR NAVEEN // COGNITIVE LABS 2026</span>
      </footer>
    </div>
  );
}
