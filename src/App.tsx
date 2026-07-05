import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Calendar,
  Database,
  Terminal,
  MessageCircle,
  Clock,
  Volume2,
  Cpu,
  Settings,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  RotateCw,
  Maximize,
  Power,
  Sliders,
  Sparkles,
  Droplet,
  Coffee,
  HelpCircle,
  FileCode,
  AlertTriangle,
  FolderOpen
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

// Cozy Lo-Fi Tracklist
const LOFI_TRACKS = [
  {
    title: "Even the Artificial Sun Lies...",
    artist: "Airi Ambient Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "06:12"
  },
  {
    title: "Warm Cozy Espresso",
    artist: "Tokyo Coffee Shop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "07:05"
  },
  {
    title: "Midnight Ollama Reasoning",
    artist: "Synaptic Lofi Core",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: "05:02"
  },
  {
    title: "Telugu Evening Raindrops",
    artist: "Hyderabad Chill Lounge",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: "05:38"
  }
];

// Interactive background sound elements
const AMBIENT_SOUNDS = [
  { id: "rain", label: "Tokyo Rain 🌧️", url: "https://assets.mixkit.co/active_storage/sfx/2526/2526-84.wav" },
  { id: "cafe", label: "Cozy Cafe ☕", url: "https://assets.mixkit.co/active_storage/sfx/2633/2633-84.wav" },
  { id: "wind", label: "Mountain Wind 🍃", url: "https://assets.mixkit.co/active_storage/sfx/1118/1118-84.wav" }
];

export default function App() {
  // Navigation / Panel states
  const [activePanel, setActivePanel] = useState<"chat" | "study" | "pdf" | "memory" | "calendar" | "download" | "soundboard" | null>(null);
  const [emotion, setEmotion] = useState<Emotion>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false); // Powers Webcam Surveillance
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "te">("te"); // Telugu Default Female Voice
  const [isDayMode, setIsDayMode] = useState(false); // Day/Night toggle for window
  
  // Stats Counters (hotspot interaction feedback)
  const [hydrationCups, setHydrationCups] = useState(0);
  const [coffeeEnergy, setCoffeeEnergy] = useState(60); // Percentage 0-100
  const [studyStreak, setStudyStreak] = useState(5);
  const [notification, setNotification] = useState<string | null>(null);

  // Focus Stopwatch (Top Right Timer)
  const [timerSeconds, setTimerSeconds] = useState(39); // Starts at 00:39 like image!
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Audio Engine States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [trackProgress, setTrackProgress] = useState(0); // seconds
  const [trackDuration, setTrackDuration] = useState(372); // seconds (6:12)
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(true);

  // Ambient soundboard triggers (simple toggles)
  const [activeAmbients, setActiveAmbients] = useState<Record<string, boolean>>({
    rain: false,
    cafe: false,
    wind: false
  });

  // Audio refs
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Web Audio Context Synthesizer (for native gurgles and retro chimes)
  const playNativeSynthChime = (type: "bubble" | "sip" | "chime") => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "bubble") {
        // Gurgling bubble synth
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "sip") {
        // Slurping/sip synth
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Double ding bell chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn("WebAudio context failed to start:", e);
    }
  };

  // Notification helper
  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

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

  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "airi",
      text: "Hello, Naveen! I am Airi, your personal desktop AI companion and study coach. Let's make this study session super productive! You can chat with me, upload notes to generate cards, or turn on 'Study Mode' so I can monitor distractions.",
      timestamp: new Date(),
    },
  ]);

  // Distraction history log
  const [distractionLogs, setDistractionLogs] = useState<DistractionLog[]>([
    {
      id: "1",
      time: "10:15 AM",
      type: "Phone Usage",
      duration: "45s",
      airiReaction: "Naveen, please put that smartphone away! You're in the middle of a study cycle!",
    },
  ]);

  // Real-time Clock (Top Left)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Study focus stopwatch timer ticking
  useEffect(() => {
    let focusTimer: any = null;
    if (isTimerRunning) {
      focusTimer = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(focusTimer);
  }, [isTimerRunning]);

  // HTML5 Lofi Audio Controls
  useEffect(() => {
    const audio = new Audio(LOFI_TRACKS[currentTrackIndex].url);
    audio.volume = isMuted ? 0 : audioVolume;
    audio.loop = isLoop;
    musicAudioRef.current = audio;

    const handleTimeUpdate = () => {
      setTrackProgress(Math.floor(audio.currentTime));
    };

    const handleLoadedMetadata = () => {
      setTrackDuration(Math.floor(audio.duration) || 240);
    };

    const handleTrackEnded = () => {
      if (isLoop) {
        audio.play().catch(() => {});
      } else {
        handleNextTrack();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleTrackEnded);

    if (isPlaying) {
      audio.play().catch((e) => {
        console.warn("Audio autoplay blocked or failed:", e);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleTrackEnded);
    };
  }, [currentTrackIndex]);

  // Track progress and volume adjustments
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = isMuted ? 0 : audioVolume;
    }
  }, [audioVolume, isMuted]);

  const handlePlayPause = () => {
    if (!musicAudioRef.current) return;
    if (isPlaying) {
      musicAudioRef.current.pause();
      setIsPlaying(false);
      setEmotion("idle");
    } else {
      musicAudioRef.current.play().catch(() => {});
      setIsPlaying(true);
      setEmotion("excited");
      playNativeSynthChime("chime");
    }
  };

  const handleNextTrack = () => {
    let nextIndex = currentTrackIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * LOFI_TRACKS.length);
    } else if (nextIndex >= LOFI_TRACKS.length) {
      nextIndex = 0;
    }
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    setEmotion("happy");
    playNativeSynthChime("chime");
  };

  const handlePrevTrack = () => {
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = LOFI_TRACKS.length - 1;
    }
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
    setEmotion("happy");
    playNativeSynthChime("chime");
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (musicAudioRef.current) {
      musicAudioRef.current.currentTime = val;
      setTrackProgress(val);
    }
  };

  // Ambient sound selector toggle
  const toggleAmbientSound = (soundId: string) => {
    setActiveAmbients((prev) => {
      const updated = { ...prev, [soundId]: !prev[soundId] };
      const url = AMBIENT_SOUNDS.find((s) => s.id === soundId)?.url || "";
      
      if (updated[soundId]) {
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0.4;
        audio.play().catch(() => {});
        ambientAudioRefs.current[soundId] = audio;
      } else {
        if (ambientAudioRefs.current[soundId]) {
          ambientAudioRefs.current[soundId].pause();
          delete ambientAudioRefs.current[soundId];
        }
      }
      return updated;
    });
  };

  // Speech Synth TTS Engine
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

    const cleanSpeech = text.replace(/[*#`_\-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (language === "te") {
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

    utterance.pitch = language === "te" ? 1.05 : 1.32;
    utterance.rate = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Failed to speak utterance:", err);
        setIsSpeaking(false);
      }
    }, 150);
  };

  // Add distraction logs
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

  // Chat text submission
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
      let systemPrompt = `You are Airi, a cheerful, helpful, anime-style desktop assistant and study coach for a student named Naveen.
Keep your answers lively, supportive, and relatively concise (under 120 words). Speak directly to Naveen.`;

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

  // Full Screen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
    triggerNotification("View mode recalibrated!");
    playNativeSynthChime("chime");
  };

  // Hotspot interaction handlers
  const handleWaterCoolerClick = () => {
    playNativeSynthChime("bubble");
    setHydrationCups((prev) => prev + 1);
    setEmotion("excited");
    const voiceMsg = language === "te"
      ? "నవీన్, మంచి నీరు తాగినందుకు అభినందనలు! ఆరోగ్యమే మహాభాగ్యం! 🥤"
      : "Excellent hydration habits, Naveen! Let's drink more water to keep our brain sharp!";
    speakText(voiceMsg);
    triggerNotification("Hydration +1 Glass! 🥤");
  };

  const handleCoffeeClick = () => {
    playNativeSynthChime("sip");
    setCoffeeEnergy(100);
    setEmotion("happy");
    const voiceMsg = language === "te"
      ? "మ్మ్! వేడి వేడి కాఫీ! నవీన్, మన స్టడీ ఎనర్జీ ఇప్పుడు పూర్తి స్థాయిలో ఉంది! ☕"
      : "Ah, sweet warm Star espresso! Energy levels fully recharged! Let's conquer these files!";
    speakText(voiceMsg);
    triggerNotification("Energy fully recharged! ☕⚡");
  };

  const handlePlantClick = () => {
    playNativeSynthChime("chime");
    setEmotion("excited");
    triggerNotification("Sparkles grow on your fern! 🌱✨");
    const phrases = [
      "Keep nurturing your knowledge, Naveen!",
      "Like this beautiful fern, your skills are blooming daily!",
      "Quiet focus creates massive results!"
    ];
    speakText(phrases[Math.floor(Math.random() * phrases.length)]);
  };

  const handleWindowClick = () => {
    playNativeSynthChime("chime");
    setIsDayMode(!isDayMode);
    triggerNotification(isDayMode ? "Dusk settles in... 🌌" : "Morning sun rises... 🌅");
  };

  const handleAiriClick = () => {
    setEmotion("embarrassed");
    playNativeSynthChime("chime");
    const greetings = language === "te"
      ? [
          "ఏంటి నవీన్? నేను ఇక్కడే ఉండి నీ చదువుని గమనిస్తున్నాను! బాగా చదువుకో! 🌸",
          "నీ పక్కన నేను ఉన్నాను నవీన్, ఎప్పుడూ అలసట పడవద్దు!",
          "మనం ఇద్దరం కలిసి ఈరోజు చాలా చదువుకుందాం!"
        ]
      : [
          "Yes, Naveen? I'm watching you study! Keep up the incredible work! 🌸",
          "Airi is right here! Let me know if you need to summarize any notes!",
          "Your local Ollama model is fully loaded and ready to think!"
        ];
    speakText(greetings[Math.floor(Math.random() * greetings.length)]);
  };

  // Formatting helpers
  const formatTimeHM = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const formatDateYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  const formatStopwatch = (totalSecs: number) => {
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#111116] text-white flex flex-col justify-between selection:bg-brand-pink/30 selection:text-white relative overflow-hidden font-sans scanline">
      
      {/* ========================================================= */}
      {/* COZY PIXEL-ART BACKDROP DESIGN WITH FULL INTERACTION      */}
      {/* ========================================================= */}
      <div className={`absolute inset-0 transition-all duration-1000 ease-in-out z-0 flex items-center justify-center overflow-hidden ${
        isDayMode 
          ? "bg-gradient-to-b from-[#87CEEB] via-[#E0F6FF] to-[#D2B48C]" 
          : "bg-gradient-to-b from-[#090913] via-[#1a1b35] to-[#25152a]"
      }`}>
        
        {/* Retro Grid Floor Accent */}
        <div className="absolute bottom-0 w-full h-[35%] bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

        {/* 1. PIXEL ART COZY WINDOW (Left) */}
        <div 
          onClick={handleWindowClick}
          className="absolute left-[6%] top-[10%] w-[240px] h-[280px] bg-[#1e2330]/90 border-[4px] border-[#3a3f58] rounded-md overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer group"
          title="Toggle Day/Night Weather"
        >
          {/* Night/Day Window view */}
          <div className={`w-full h-full relative transition-all duration-1000 ${
            isDayMode ? "bg-[#bfe6ff]" : "bg-gradient-to-b from-[#111322] to-[#242b4d]"
          }`}>
            {/* Stars / Moon */}
            {!isDayMode ? (
              <>
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#fef3c7] opacity-90 blur-[1px]" />
                <div className="absolute top-12 left-10 w-1 h-1 bg-white rounded-full animate-ping" />
                <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-white/70 rounded-full" />
              </>
            ) : (
              <>
                <div className="absolute top-8 left-8 w-10 h-10 rounded-full bg-[#fbbf24] shadow-lg animate-pulse" />
                <div className="absolute top-14 right-10 w-20 h-6 bg-white/65 rounded-full blur-[2px]" />
              </>
            )}

            {/* Falling Cherry Blossom Leaves / Petals (HTML particle stream) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-brand-pink/80 rounded-full animate-bounce"
                  style={{
                    width: "6px",
                    height: "4px",
                    left: `${15 + i * 16}%`,
                    top: `${10 + (i * 20) % 80}%`,
                    opacity: 0.65,
                    transform: `rotate(${i * 45}deg)`,
                    animationDuration: `${3 + i}s`,
                    animationDelay: `${i * 0.5}s`
                  }}
                />
              ))}
            </div>

            {/* Pixel Tree Silhouette */}
            <div className="absolute bottom-0 w-full h-[60px] bg-gradient-to-t from-black/40 to-transparent">
              <svg className="w-full h-full text-[#0d0f19] opacity-90" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,100 L10,80 L25,90 L40,75 L60,85 L80,70 L100,95 L100,100 Z" fill="currentColor" />
              </svg>
            </div>
          </div>
          {/* Glass glare effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* 2. WATER COOLER DISPENSER (Left Middle) */}
        <div 
          onClick={handleWaterCoolerClick}
          className="absolute left-[26%] bottom-[20%] w-[100px] h-[280px] flex flex-col items-center justify-end group cursor-pointer z-10"
          title="Click to Drink Water (Hydration Meter)"
        >
          {/* Water Jug (Top) */}
          <div className="w-[65px] h-[95px] bg-[#3b82f6]/40 border-[3px] border-[#60a5fa] rounded-t-3xl rounded-b-lg flex flex-col justify-end p-2 relative group-hover:scale-105 transition-transform duration-300">
            {/* Water liquid lines */}
            <div className="w-full h-[75%] bg-gradient-to-b from-[#93c5fd]/50 to-[#2563eb]/70 rounded-b-md animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-10 bg-white/25 rounded-full blur-[1px]" />
            </div>
          </div>

          {/* Cooler Base Stand */}
          <div className="w-[85px] h-[155px] bg-[#f8fafc] border-[3px] border-[#cbd5e1] rounded-b-md flex flex-col justify-between p-3.5 shadow-2xl relative">
            {/* Hot / Cold Taps */}
            <div className="flex justify-around items-center mt-2">
              {/* Hot Tap (Red) */}
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 bg-red-500 rounded-full border border-red-700 cursor-pointer active:scale-90" />
                <span className="text-[7px] font-mono font-bold text-red-500 mt-1">H</span>
              </div>
              {/* Cold Tap (Blue) */}
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full border border-blue-700 cursor-pointer active:scale-90" />
                <span className="text-[7px] font-mono font-bold text-blue-500 mt-1">C</span>
              </div>
            </div>

            {/* Dispenser Nozzle / Grate */}
            <div className="w-full h-[55px] bg-[#334155] border-2 border-[#1e293b] rounded-md flex flex-col justify-between items-center p-1">
              <div className="w-2 h-4 bg-[#64748b] rounded-b-md" />
              {/* Drip Grate */}
              <div className="w-full h-1.5 bg-[#475569] border-t border-[#1e293b]" />
            </div>
            
            {/* Label */}
            <div className="text-[7px] font-mono text-center text-slate-400 select-none">
              Airi Hydrator // 100% OK
            </div>
          </div>
        </div>

        {/* 3. COZY WOOD BOOKSHELF (Right) */}
        <div 
          onClick={() => {
            setActivePanel("pdf");
            triggerNotification("Notes Library opened!");
          }}
          className="absolute right-[8%] top-[12%] w-[210px] h-[450px] bg-[#4a3525] border-[4px] border-[#2f2015] rounded-md flex flex-col p-3 gap-6 shadow-2xl cursor-pointer hover:border-brand-pink/40 transition-all z-10"
          title="Click to Open Study Library & Notes"
        >
          {/* Row of Books 1 */}
          <div className="flex-1 flex items-end justify-start border-b-[4px] border-[#2f2015] pb-1 gap-1.5 relative">
            <div className="w-5 h-[80px] bg-red-500 border border-red-700 rounded-t-sm" />
            <div className="w-4 h-[75px] bg-blue-500 border border-blue-700 rounded-t-sm" />
            <div className="w-6 h-[85px] bg-amber-500 border border-amber-700 rounded-t-sm rotate-6 transform origin-bottom" />
            <div className="w-4 h-[80px] bg-emerald-500 border border-emerald-700 rounded-t-sm" />
            <div className="w-5 h-[70px] bg-purple-500 border border-purple-700 rounded-t-sm" />
          </div>

          {/* Row of Books 2 */}
          <div className="flex-1 flex items-end justify-end border-b-[4px] border-[#2f2015] pb-1 gap-1 relative">
            <div className="w-4 h-[75px] bg-cyan-500 border border-cyan-700 rounded-t-sm" />
            <div className="w-5 h-[80px] bg-rose-500 border border-rose-700 rounded-t-sm" />
            <div className="w-5 h-[70px] bg-yellow-500 border border-yellow-700 rounded-t-sm" />
            <div className="w-4.5 h-[85px] bg-violet-600 border border-violet-800 rounded-t-sm" />
            <div className="w-5 h-[65px] bg-slate-400 border border-slate-600 rounded-t-sm -rotate-12 transform origin-bottom-right" />
          </div>

          {/* Row of Books 3 */}
          <div className="flex-1 flex items-end justify-center border-b-[4px] border-[#2f2015] pb-1 gap-1.5 relative">
            <div className="w-5.5 h-[70px] bg-emerald-600 border border-emerald-800 rounded-t-sm" />
            <div className="w-4.5 h-[85px] bg-amber-600 border border-amber-800 rounded-t-sm" />
            <div className="w-5 h-[80px] bg-indigo-500 border border-indigo-700 rounded-t-sm" />
            <div className="w-4 h-[75px] bg-red-600 border border-red-800 rounded-t-sm" />
          </div>
        </div>

        {/* 4. HOUSEPLANT (Behind Bookshelf / Desk Right) */}
        <div 
          onClick={handlePlantClick}
          className="absolute right-[22%] bottom-[16%] w-[110px] h-[220px] flex flex-col items-center justify-end cursor-pointer group z-10"
          title="Click to tend the plant"
        >
          {/* Animated Green Fern Leaves */}
          <div className="relative w-[130px] h-[130px] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            {/* Top Leaf */}
            <div className="absolute top-2 w-8 h-20 bg-emerald-500 rounded-full border-[2.5px] border-emerald-700 origin-bottom transform rotate-12 -translate-y-2" />
            {/* Left Leaves */}
            <div className="absolute left-0 w-22 h-8 bg-emerald-600 rounded-full border-[2.5px] border-emerald-800 origin-right transform -rotate-12" />
            <div className="absolute left-2 top-8 w-20 h-8 bg-emerald-500 rounded-full border-[2.5px] border-emerald-700 origin-right transform -rotate-45" />
            {/* Right Leaves */}
            <div className="absolute right-0 w-22 h-8 bg-emerald-600 rounded-full border-[2.5px] border-emerald-800 origin-left transform rotate-12" />
            <div className="absolute right-2 top-8 w-20 h-8 bg-emerald-500 rounded-full border-[2.5px] border-emerald-700 origin-left transform rotate-45" />
          </div>

          {/* Plant Pot */}
          <div className="w-[65px] h-[75px] bg-[#d97706] border-[3px] border-[#b45309] rounded-b-xl shadow-xl flex items-center justify-center">
            <div className="w-full h-2.5 bg-[#b45309] border-b border-[#78350f] self-start" />
          </div>
        </div>

        {/* 5. INTERACTIVE CENTERPIECE CHARACTER & WORK DESK */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="relative w-[340px] h-[340px] pointer-events-auto cursor-pointer" onClick={handleAiriClick}>
            <AiriCharacter emotion={emotion} isSpeaking={isSpeaking} />
            
            {/* Floating Speech bubble directly over her twintails */}
            {isSpeaking && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#141517]/95 border-2 border-brand-pink text-brand-pink text-[11px] font-semibold px-4 py-2 rounded-2xl shadow-2xl max-w-xs animate-bounce whitespace-nowrap text-center">
                Airi: Talking... 🌸
              </div>
            )}
          </div>
        </div>

        {/* 6. STAR COFFEE HOTSPOT (On Left Desk Corner / Center Right) */}
        <div 
          onClick={handleCoffeeClick}
          className="absolute left-[54%] bottom-[16%] w-[70px] h-[95px] cursor-pointer group z-20"
          title="Click to Sip Star Coffee (Energy Meter)"
        >
          {/* Coffee container */}
          <div className="w-[45px] h-[70px] bg-[#1e3a8a] border-[3px] border-white/90 rounded-b-xl rounded-t-md relative flex flex-col justify-between p-1.5 shadow-2xl group-hover:scale-105 transition-transform duration-300">
            {/* Whipped Cream Top */}
            <div className="absolute -top-4 left-1 w-[32px] h-[15px] bg-slate-100 border-[2.5px] border-slate-300 rounded-full" />
            {/* Slanted straw */}
            <div className="absolute -top-7 right-2 w-1.5 h-10 bg-amber-500 rotate-12" />
            
            {/* Cup Design Star Pattern */}
            <div className="flex-1 flex flex-col items-center justify-center mt-2">
              <span className="text-[8px] font-black tracking-widest text-amber-400 uppercase font-mono">STAR</span>
              <div className="flex gap-0.5 mt-0.5 text-[8px] text-amber-400">★ ★ ★</div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 1. DATE / CALENDAR HUD DISPLAY (Top Left)                 */}
      {/* ========================================================= */}
      <div className="absolute left-6 top-6 z-30 select-none pointer-events-auto flex items-center space-x-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 backdrop-blur-md shadow-2xl transition-all hover:border-white/20">
        <div className="p-1.5 bg-brand-pink/15 border border-brand-pink/30 rounded-full flex items-center justify-center">
          <Clock className="h-4 w-4 text-brand-pink" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 text-[11px] font-bold text-white/90">
            <span className="font-mono">{formatDateYMD(currentTime)}</span>
            <span className="text-[9px] text-brand-pink font-mono uppercase px-1.5 py-0.5 rounded bg-brand-pink/10">
              {formatDayName(currentTime).substring(0, 3)}
            </span>
          </div>
          <span className="text-lg font-black tracking-tight text-white font-mono leading-none mt-0.5">
            {formatTimeHM(currentTime)}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DYNAMIC DRINK TIMER / STOPWATCH (Top Right)            */}
      {/* ========================================================= */}
      <div className="absolute right-6 top-6 z-30 flex items-center space-x-3 select-none pointer-events-auto bg-white/5 border border-white/10 rounded-full pl-4 pr-5 py-2.5 backdrop-blur-md shadow-2xl transition-all hover:border-white/20">
        
        {/* Interactive drink container */}
        <div 
          onClick={handleCoffeeClick}
          className="relative h-11 w-10 group cursor-pointer"
          title="Naveen's Sweet Lofi Coffee Beverage"
        >
          {/* Circular yellow lemon wedge */}
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center shadow-md group-hover:rotate-45 transition-transform">
            <div className="w-full h-0.5 bg-yellow-600/30" />
            <div className="w-0.5 h-full bg-yellow-600/30 absolute" />
          </div>
          {/* Striped straw */}
          <div className="absolute -top-3 left-2.5 w-1 h-6 bg-gradient-to-b from-brand-pink via-white to-brand-pink border-r border-brand-pink/30 rounded-full transform -rotate-12" />
          
          {/* Glass cup containing sparkling liquid */}
          <div className="absolute bottom-0 w-full h-[28px] bg-white/15 border border-white/30 rounded-b-md rounded-t-sm flex flex-col justify-end p-0.5 overflow-hidden">
            {/* Sparkle lines */}
            <div className="w-full h-[70%] bg-gradient-to-t from-brand-pink/85 to-brand-violet/40 rounded-b-sm animate-pulse" />
          </div>
        </div>

        <div className="h-6 border-r border-white/10" />

        {/* Focus Stopwatch */}
        <button 
          onClick={() => {
            setIsTimerRunning(!isTimerRunning);
            triggerNotification(isTimerRunning ? "Focus stopwatch paused!" : "Focus stopwatch resumed!");
            playNativeSynthChime("chime");
          }}
          className="flex flex-col items-start transition-all hover:text-brand-pink cursor-pointer text-left"
          title="Click to Pause/Play focus session"
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-ping" />
            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider">FOCUS TIMER</span>
          </div>
          <span className="text-lg font-black text-white font-mono mt-0.5">
            {formatStopwatch(timerSeconds)}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. FLOATING HUD STATS BAR (Top Center)                    */}
      {/* ========================================================= */}
      <div className="absolute left-1/2 -translate-x-1/2 top-6 z-20 hidden lg:flex items-center space-x-3 pointer-events-auto bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md shadow-2xl">
        {/* Hydration Tracker */}
        <div 
          onClick={handleWaterCoolerClick}
          className="bg-black/40 hover:bg-brand-cyan/10 transition-colors border border-white/10 rounded-full px-4 py-1.5 flex items-center space-x-2 text-xs font-semibold cursor-pointer select-none"
          title="Water Cups Drank today"
        >
          <Droplet className="h-4 w-4 text-brand-cyan animate-bounce" />
          <span className="text-white/85">Hydration: <b className="text-brand-cyan font-mono">{hydrationCups}</b> / 8 cups</span>
        </div>

        {/* Coffee Energy Level */}
        <div 
          onClick={handleCoffeeClick}
          className="bg-black/40 hover:bg-yellow-400/10 transition-colors border border-white/10 rounded-full px-4 py-1.5 flex items-center space-x-2 text-xs font-semibold cursor-pointer select-none"
          title="Naveen's Current Coffee Energy Level"
        >
          <Coffee className="h-4 w-4 text-yellow-400" />
          <span className="text-white/85">Energy: <b className="text-yellow-400 font-mono">{coffeeEnergy}%</b></span>
          <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5 ml-1">
            <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${coffeeEnergy}%` }} />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. REAL AUDIO MUSIC PLAYER CONTROLLER (Bottom Center)     */}
      {/* ========================================================= */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-auto">
        <div className="bg-[#100c1e]/90 border border-brand-pink/30 rounded-2xl p-4.5 shadow-2xl backdrop-blur-md flex flex-col space-y-3.5">
          
          {/* Top Line: Track info & buttons */}
          <div className="flex items-center justify-between">
            {/* Song Title details with rotating vinyl disk */}
            <div className="flex items-center space-x-3 truncate pr-4">
              {/* Spinning Vinyl Disc Art */}
              <div className="relative w-10 h-10 shrink-0 select-none">
                <div 
                  className={`w-full h-full rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center relative shadow-md ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
                >
                  {/* Vinyl Grooves */}
                  <div className="w-8 h-8 rounded-full border border-slate-800/80 absolute" />
                  <div className="w-6 h-6 rounded-full border border-slate-800/50 absolute" />
                  {/* Label Center */}
                  <div className="w-4 h-4 rounded-full bg-brand-pink flex items-center justify-center animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-black" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col truncate">
                <span className="text-[9px] font-mono text-brand-pink uppercase tracking-widest font-bold">LO-FI STUDY STATION</span>
                <span className="text-xs font-bold text-white truncate mt-0.5">{LOFI_TRACKS[currentTrackIndex].title}</span>
                <span className="text-[9px] text-white/50 truncate mt-0.5">{LOFI_TRACKS[currentTrackIndex].artist}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Shuffle toggle */}
              <button 
                onClick={() => {
                  setIsShuffle(!isShuffle);
                  triggerNotification(isShuffle ? "Shuffle disabled!" : "Shuffle enabled!");
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isShuffle ? "text-brand-pink bg-brand-pink/15" : "text-white/40 hover:text-white"}`}
                title="Shuffle playlist"
              >
                <Shuffle className="h-4 w-4" />
              </button>

              {/* Prev Track */}
              <button 
                onClick={handlePrevTrack}
                className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Previous track"
              >
                <SkipBack className="h-4.5 w-4.5" />
              </button>

              {/* Main Play/Pause */}
              <button 
                onClick={handlePlayPause}
                className="p-2.5 bg-brand-pink text-brand-black hover:scale-105 active:scale-95 rounded-xl transition-all shadow-md shadow-brand-pink/30 cursor-pointer"
                title={isPlaying ? "Pause study music" : "Play study music"}
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              </button>

              {/* Next Track */}
              <button 
                onClick={handleNextTrack}
                className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Next track"
              >
                <SkipForward className="h-4.5 w-4.5" />
              </button>

              {/* Repeat / Loop toggle */}
              <button 
                onClick={() => {
                  setIsLoop(!isLoop);
                  triggerNotification(isLoop ? "Loop disabled!" : "Repeating active track!");
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLoop ? "text-brand-pink bg-brand-pink/15" : "text-white/40 hover:text-white"}`}
                title="Loop current track"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Middle Line: Interactive Seek Progress Bar */}
          <div className="flex items-center space-x-3 text-[11px] font-mono text-white/40 select-none">
            <span>{formatStopwatch(trackProgress)}</span>
            <input 
              type="range"
              min={0}
              max={trackDuration}
              value={trackProgress}
              onChange={handleProgressChange}
              className="flex-1 accent-brand-pink h-1 rounded-lg bg-white/10 cursor-pointer"
            />
            <span>{LOFI_TRACKS[currentTrackIndex].duration}</span>
          </div>

          {/* Bottom Line: Volume and Mixer options */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            {/* Quick volume controller */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 text-white/60 hover:text-white cursor-pointer"
                title="Mute/Unmute"
              >
                <Volume2 className={`h-4 w-4 ${isMuted ? "text-red-500" : "text-brand-pink animate-pulse"}`} />
              </button>
              <input 
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-20 accent-brand-pink h-1 rounded-lg bg-white/15 cursor-pointer"
              />
            </div>

            {/* Quick Ambient sound toggles directly on bar */}
            <div className="flex items-center space-x-2.5">
              <span className="text-[9px] font-mono text-white/40 uppercase">AMBIENTS:</span>
              <div className="flex space-x-1">
                {AMBIENT_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => toggleAmbientSound(sound.id)}
                    className={`px-2 py-1 rounded-md text-[9px] font-mono border transition-all cursor-pointer ${
                      activeAmbients[sound.id]
                        ? "bg-brand-pink/25 border-brand-pink text-brand-pink font-bold"
                        : "bg-black/40 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {sound.id.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. VERTICAL NAVIGATION CONTROL RAIL (Right Overlay)       */}
      {/* ========================================================= */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <div className="bg-[#1f1a2e]/90 border border-brand-pink/35 rounded-2xl py-5 px-3 flex flex-col items-center space-y-4 shadow-2xl backdrop-blur-md">
          
          {/* Collapse Indicator arrow */}
          <button 
            onClick={() => {
              setActivePanel(null);
              triggerNotification("All glass overlays packed away!");
              playNativeSynthChime("chime");
            }}
            className="p-1.5 hover:bg-white/5 text-white/50 hover:text-brand-pink rounded-xl transition-all cursor-pointer"
            title="Minimize active drawers"
          >
            <ChevronUp className="h-4.5 w-4.5" />
          </button>

          <hr className="w-6 border-white/10" />

          {/* PDF Notes Analyzer button */}
          <button
            onClick={() => {
              setActivePanel(activePanel === "pdf" ? null : "pdf");
              playNativeSynthChime("chime");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activePanel === "pdf"
                ? "bg-brand-pink/20 border-brand-pink text-brand-pink shadow-lg shadow-brand-pink/20"
                : "bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
            }`}
            title="Open Notes Analyzer & PDF Hub"
          >
            <BookOpen className="h-5 w-5" />
          </button>

          {/* Study Metrics / Dashboard button */}
          <button
            onClick={() => {
              setActivePanel(activePanel === "study" ? null : "study");
              playNativeSynthChime("chime");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activePanel === "study"
                ? "bg-brand-pink/20 border-brand-pink text-brand-pink shadow-lg shadow-brand-pink/20"
                : "bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
            }`}
            title="Check Study Focus Stats"
          >
            <Calendar className="h-5 w-5" />
          </button>

          {/* Ambient Music selectors soundboard */}
          <button
            onClick={() => {
              setActivePanel(activePanel === "soundboard" ? null : "soundboard");
              playNativeSynthChime("chime");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activePanel === "soundboard"
                ? "bg-brand-pink/20 border-brand-pink text-brand-pink shadow-lg shadow-brand-pink/20"
                : "bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
            }`}
            title="Mix Lofi Ambient Soundscapes"
          >
            <Sliders className="h-5 w-5" />
          </button>

          {/* Interactive Chats with Airi */}
          <button
            onClick={() => {
              setActivePanel(activePanel === "chat" ? null : "chat");
              playNativeSynthChime("chime");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activePanel === "chat"
                ? "bg-brand-pink/20 border-brand-pink text-brand-pink shadow-lg shadow-brand-pink/20"
                : "bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
            }`}
            title="Chat with Airi (Telegu & English)"
          >
            <MessageCircle className="h-5 w-5" />
          </button>

          {/* Fullscreen view toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-3 rounded-xl bg-black/30 border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            title="Toggle Cinematic Fullscreen"
          >
            <Maximize className="h-5 w-5" />
          </button>

          {/* AI Settings cog */}
          <button
            onClick={() => {
              setActivePanel(null);
              setShowEngineSettings(!showEngineSettings);
              playNativeSynthChime("chime");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              showEngineSettings
                ? "bg-brand-pink/20 border-brand-pink text-brand-pink shadow-lg"
                : "bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
            }`}
            title="Configure Gemini & Local Ollama AI"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Download Native Code folder */}
          <button
            onClick={() => {
              setActivePanel(activePanel === "download" ? null : "download");
              playNativeSynthChime("chime");
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activePanel === "download"
                ? "bg-brand-pink/20 border-brand-pink text-brand-pink shadow-lg"
                : "bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
            }`}
            title="Get MacBook Desktop Client Python Files"
          >
            <FolderOpen className="h-5 w-5" />
          </button>

          <hr className="w-6 border-white/10" />

          {/* Power Switch: Webcam Focus tracking */}
          <button
            onClick={() => {
              setIsStudyMode(!isStudyMode);
              setEmotion(isStudyMode ? "idle" : "excited");
              triggerNotification(isStudyMode ? "Webcam Surveillance OFFLINE" : "Airi Webcam Surveillance ENGAGED");
              playNativeSynthChime("sip");
              
              const notice = isStudyMode 
                ? (language === "te" ? "వెబ్‌క్యామ్ నిఘా నిలిపివేయబడింది" : "Camera tracking offline, rest up Naveen!")
                : (language === "te" ? "వెబ్‌క్యామ్ సక్రియం చేయబడింది! మీ దృష్టిని గమనిస్తున్నాను!" : "Webcam focus active! I will help keep you focused, Naveen!");
              speakText(notice);
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              isStudyMode
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20 animate-pulse"
                : "bg-black/30 border-white/10 text-white/45 hover:bg-white/5 hover:text-white"
            }`}
            title="Toggle Webcam Gaze & Posture Tracking"
          >
            <Power className="h-5 w-5" />
          </button>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. FLOATING WEBCAM MONITOR OVERLAY (Only if study mode)   */}
      {/* ========================================================= */}
      {isStudyMode && (
        <div className="absolute left-6 bottom-32 z-40 bg-black/85 border border-brand-cyan/40 rounded-2xl p-3 w-64 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <span className="text-[9px] font-mono text-brand-cyan font-bold uppercase tracking-wider">WEBCAM ACTIVE // TELEMETRY</span>
            </div>
            <button 
              onClick={() => setIsStudyMode(false)}
              className="text-[9px] font-mono text-red-500 hover:underline"
            >
              CLOSE
            </button>
          </div>
          
          {/* Frame processor rendering */}
          <div className="h-40 rounded-xl overflow-hidden bg-slate-950 border border-white/5 relative">
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
          <p className="text-[8px] font-mono text-slate-400 mt-1.5 leading-normal">
            *Face Landmark symmetry maps and cell phone neural networks are computed strictly local.
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. HIGH TECH GLASS PANEL SLIDING OVERLAYS                  */}
      {/* ========================================================= */}
      {activePanel && (
        <div className="absolute inset-y-0 left-0 z-40 w-full max-w-2xl bg-[#0a0614]/90 border-r border-brand-pink/20 shadow-2xl shadow-brand-pink/5 backdrop-blur-xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-left duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-pink/15 text-brand-pink border border-brand-pink/30 rounded-xl">
                {activePanel === "pdf" && <BookOpen className="h-5 w-5" />}
                {activePanel === "study" && <Calendar className="h-5 w-5" />}
                {activePanel === "soundboard" && <Sliders className="h-5 w-5" />}
                {activePanel === "chat" && <MessageCircle className="h-5 w-5" />}
                {activePanel === "download" && <Terminal className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-md font-bold text-white uppercase tracking-wider">
                  {activePanel === "pdf" && "PDF Study Notes Analyzer"}
                  {activePanel === "study" && "Semester Calendar & Distraction Stats"}
                  {activePanel === "soundboard" && "Ambient Soundscapes Mixer"}
                  {activePanel === "chat" && "Conversation Hub with Airi"}
                  {activePanel === "download" && "MacBook Desktop Companion Source"}
                </h2>
                <p className="text-xs text-white/50">Manage your offline files and metrics</p>
              </div>
            </div>

            <button
              onClick={() => setActivePanel(null)}
              className="text-xs font-mono font-bold text-brand-pink border border-brand-pink/20 hover:border-brand-pink/50 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer"
            >
              CLOSE (ESC)
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto pr-1">
            {activePanel === "pdf" && (
              <PDFHub
                aiProvider={aiProvider}
                ollamaUrl={ollamaUrl}
                ollamaModel={ollamaModel}
              />
            )}

            {activePanel === "study" && (
              <div className="space-y-6">
                {/* Embedded Telugu & English Speech Language toggle inside stats drawer */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Speech Synthesis Companion Language</h3>
                    <p className="text-xs text-white/50">Switch Airi's spoken voice feedback</p>
                  </div>
                  <div className="flex bg-white/5 border border-white/10 rounded-full p-1 text-xs shrink-0 self-start">
                    <button
                      onClick={() => {
                        setLanguage("en");
                        speakText("English active, Naveen!");
                        triggerNotification("Voice switched to English!");
                      }}
                      className={`px-3.5 py-1 rounded-full font-bold transition-all ${
                        language === "en"
                          ? "bg-brand-pink text-brand-black shadow"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      ENGLISH
                    </button>
                    <button
                      onClick={() => {
                        setLanguage("te");
                        speakText("భాష తెలుగులోకి మార్చబడింది!");
                        triggerNotification("Voice switched to Telugu!");
                      }}
                      className={`px-3.5 py-1 rounded-full font-bold transition-all ${
                        language === "te"
                          ? "bg-brand-pink text-brand-black shadow"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      తెలుగు (TELUGU)
                    </button>
                  </div>
                </div>

                <StudyDashboard
                  isStudyMode={isStudyMode}
                  setIsStudyMode={setIsStudyMode}
                  distractionLogs={distractionLogs}
                  onAddDistractionLog={handleAddDistractionLog}
                  speakText={speakText}
                  setEmotion={setEmotion}
                  language={language}
                />
                
                {/* Additional Semester Calendar Scheduler */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 font-mono mb-4">Semester Exam Scheduler</h3>
                  <CalendarScheduler />
                </div>
              </div>
            )}

            {activePanel === "soundboard" && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Binaural Study Ambience Soundboard</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Mix background environment white noise simultaneously alongside your primary Lofi study music. Ideal for maskers or focus blocks.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {AMBIENT_SOUNDS.map((sound) => (
                    <div 
                      key={sound.id}
                      className={`border rounded-2xl p-5 flex flex-col justify-between h-36 transition-all ${
                        activeAmbients[sound.id]
                          ? "bg-brand-pink/15 border-brand-pink text-white shadow-lg"
                          : "bg-black/30 border-white/10 text-white/60"
                      }`}
                    >
                      <span className="text-sm font-bold">{sound.label}</span>
                      <button
                        onClick={() => toggleAmbientSound(sound.id)}
                        className={`w-full py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          activeAmbients[sound.id]
                            ? "bg-brand-pink text-brand-black"
                            : "bg-white/5 hover:bg-white/10 text-white"
                        }`}
                      >
                        {activeAmbients[sound.id] ? "MUTE AMBIENT" : "ACTIVATE"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "chat" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-[480px]">
                <div className="md:col-span-8 flex flex-col h-full justify-between">
                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    loading={loading}
                    setEmotion={setEmotion}
                    aiProvider={aiProvider}
                    ollamaModel={ollamaModel}
                  />
                </div>
                <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <VoiceAssistant
                    onTranscript={(txt) => handleSendMessage(txt, false)}
                    isSpeaking={isSpeaking}
                    setIsSpeaking={setIsSpeaking}
                    speakText={speakText}
                    language={language}
                  />
                </div>
              </div>
            )}

            {activePanel === "download" && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 leading-normal text-xs text-white/70 space-y-3">
                  <p>
                    <b>Airi local companion script files</b> can be downloaded individually or in full from the tree below. 
                    Running them locally on your MacBook activates fully offline 100% private computer vision tracking.
                  </p>
                </div>
                <CodebaseDownloader />
              </div>
            )}
          </div>

          {/* Footer inside glass */}
          <div className="border-t border-white/10 pt-4 mt-5 text-[10px] text-white/30 font-mono flex justify-between">
            <span>AIRI INTELLIGENT PANEL CONSOLE</span>
            <span>SYSTEM DIRECTIVES INVOLVED</span>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 8. AI ENGINE SELECTOR MODAL                               */}
      {/* ========================================================= */}
      {showEngineSettings && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0d1a] border border-brand-pink/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <span className="text-[10px] font-mono font-bold text-brand-pink uppercase tracking-widest">
                AI Inference Config Panel
              </span>
              <button 
                onClick={() => setShowEngineSettings(false)}
                className="text-xs font-mono text-white/50 hover:text-white"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-5">
              {/* Provider Selection */}
              <div>
                <label className="text-[10px] font-mono text-white/50 block mb-1.5 uppercase tracking-wider">AI Inference Engine:</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider("gemini");
                      speakText("Switched to Gemini cloud core, Naveen!");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      aiProvider === "gemini"
                        ? "bg-brand-pink text-brand-black shadow-lg"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    GEMINI AI
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider("ollama");
                      speakText("Switched to your local Ollama instance, Naveen!");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      aiProvider === "ollama"
                        ? "bg-brand-pink text-brand-black shadow-lg"
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
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-brand-cyan placeholder-white/20 outline-none focus:border-brand-pink"
                    />
                    <span className="text-[9px] font-mono text-white/30 block mt-1.5 leading-tight">
                      *Ensure OLLAMA_ORIGINS="*" is set when running Ollama to bypass CORS policies.
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
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2 py-2 text-xs font-mono text-brand-cyan outline-none cursor-pointer"
                    >
                      <option value="gemma2">gemma2 (Recommended)</option>
                      <option value="llama3">llama3</option>
                      <option value="llama3.1">llama3.1</option>
                      <option value="mistral">mistral</option>
                      <option value="phi3">phi3</option>
                      <option value="llava">llava (Multimodal)</option>
                      <option value="custom">Custom (Type below...)</option>
                    </select>
                    
                    {(!["gemma2", "llama3", "llama3.1", "mistral", "phi3", "llava"].includes(ollamaModel) || ollamaModel === "") && (
                      <input
                        type="text"
                        placeholder="Type custom pulled model name..."
                        value={ollamaModel}
                        onChange={(e) => setOllamaModel(e.target.value)}
                        className="mt-2 w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-brand-cyan placeholder-white/20 outline-none focus:border-brand-pink"
                      />
                    )}
                  </div>
                </>
              )}
              
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[10px] font-mono text-white/50 leading-relaxed">
                {aiProvider === "ollama" 
                  ? "⚡ Running locally through Ollama means 100% free, private, offline-capable completions with zero API exhaustion!"
                  : "☁️ Gemini core delivers ultra-fast multimodality & web-grounding, but is subject to standard API request quotas."}
              </div>

              <button
                onClick={() => setShowEngineSettings(false)}
                className="w-full py-2.5 bg-brand-pink text-brand-black font-bold text-xs rounded-xl shadow-lg shadow-brand-pink/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                APPLY SETTINGS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. NOTIFICATION CENTER (Sparkle popups)                   */}
      {/* ========================================================= */}
      {notification && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-[#141517] border border-brand-pink/30 rounded-2xl px-5 py-3 shadow-2xl flex items-center space-x-2 animate-bounce">
          <Sparkles className="h-4.5 w-4.5 text-brand-pink" />
          <span className="text-xs font-bold text-white font-mono">{notification}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. humbler bottom footer info bar                        */}
      {/* ========================================================= */}
      <footer className="z-10 bg-black/45 border-t border-white/5 py-3 px-6 text-center text-[10px] text-white/30 font-mono flex flex-col sm:flex-row sm:justify-between items-center gap-1.5 select-none pointer-events-none">
        <span>AIRI COMPANION STUDY SUITE // NATIVE COGNITIVE PLATFORM</span>
        <span>DESIGNED FOR NAVEEN // COGNITIVE LABS 2026</span>
      </footer>

    </div>
  );
}
