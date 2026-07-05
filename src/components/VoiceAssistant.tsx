import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, Sparkles, RefreshCw, Radio } from "lucide-react";

interface VoiceAssistantProps {
  onTranscript: (text: string) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  speakText: (text: string) => void;
  language?: "en" | "te";
}

export default function VoiceAssistant({
  onTranscript,
  isSpeaking,
  setIsSpeaking,
  speakText,
  language = "en",
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize SpeechRecognition API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === "te" ? "te-IN" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscriptText(currentText);

        // Check for Wake Word: "Hey Airi", "Airi" or Telugu equivalents
        const hasAiri = currentText.toLowerCase().includes("airi") || 
                        currentText.includes("ఐరి") || 
                        currentText.includes("ఐరీ");

        if (!wakeWordActive && hasAiri) {
          setWakeWordActive(true);
          const response = language === "te" ? "చెప్పు నవీన్, నేను వింటున్నాను!" : "Yes, Naveen? I'm listening!";
          speakText(response);
        }

        if (finalTranscript) {
          // Send transcript up to the controller
          onTranscript(finalTranscript.trim());
          setTranscriptText(""); // Reset
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      console.warn("Web Speech Recognition API not supported in this browser.");
    }
  }, [wakeWordActive, onTranscript, speakText, language]);

  // Handle listening toggles
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is simulated here because this browser context does not support the SpeechRecognition API.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscriptText("");
      setWakeWordActive(false);
      recognitionRef.current.start();
    }
  };

  // Canvas wave visualizer (simulated mic/speaker levels)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0;

    const render = () => {
      offset += 0.15;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      const centerY = canvas.height / 2;

      // Select wave color & amplitudes based on state
      let color = "rgba(255, 255, 255, 0.15)"; // Default white line
      let amp = 2;
      let freq = 0.05;
      let waveCount = 1;

      if (isSpeaking) {
        color = "rgba(255, 45, 85, 0.95)"; // Speaking brand pink waves
        amp = 18 + Math.sin(offset * 1.5) * 6;
        freq = 0.08;
        waveCount = 3;
      } else if (isListening) {
        color = "rgba(0, 242, 255, 0.95)"; // Listening brand cyan waves
        amp = wakeWordActive ? 22 : 6 + Math.cos(offset) * 3;
        freq = 0.06;
        waveCount = 2;
      }

      // Draw beautiful sinus waves
      for (let w = 0; w < waveCount; w++) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        const currentAmp = amp * (1 - w * 0.35);
        const currentFreq = freq * (1 + w * 0.2);
        const shift = offset + w * 2.5;

        for (let x = 0; x < canvas.width; x++) {
          // Smooth the boundaries of the sine wave so it fades at the edges
          const edgeFade = Math.sin((x / canvas.width) * Math.PI);
          const y = centerY + Math.sin(x * currentFreq + shift) * currentAmp * edgeFade;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening, isSpeaking, wakeWordActive]);

  return (
    <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border transition-colors ${
            isListening 
              ? "bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan" 
              : "bg-brand-black border-white/10 text-white/50"
          }`}>
            <Radio className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Voice Control Core</h3>
            <p className="text-xs text-white/60">Wake Word & Anime Vocal Engine</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleListening}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            isListening
              ? "bg-brand-cyan text-brand-black border-brand-cyan hover:bg-brand-cyan/80"
              : "bg-brand-black border-white/10 text-white/80 hover:bg-white/5"
          }`}
        >
          {isListening ? <Mic className="h-3.5 w-3.5 animate-bounce" /> : <MicOff className="h-3.5 w-3.5" />}
          <span>{isListening ? "Listening..." : "Enable Voice"}</span>
        </button>
      </div>

      {/* Voice Sine visualizer */}
      <div className="relative w-full h-24 rounded-xl border border-white/10 bg-brand-black overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={96}
          className="w-full h-full"
        />

        {/* Dynamic State Overlay */}
        <div className="absolute inset-x-0 bottom-2 text-center">
          <p className="text-[10px] font-mono tracking-wider text-white/40 uppercase">
            {isSpeaking
              ? language === "te" ? "ఐరి వాయిస్ సింథసైజర్: యాక్టివ్" : "AIRI_VOCAL_SYNTHESIZER: ACTIVE"
              : isListening
              ? wakeWordActive
                ? language === "te" ? "ఆదేశాల కోసం వింటున్నాను..." : "HEARING COMMANDS..."
                : language === "te" ? "మేల్కొలుపు పదం కోసం వేచి ఉంది: 'ఐరి'..." : "AWAITING WAKE WORD: 'HEY AIRI'..."
              : language === "te" ? "వాయిస్ సిస్టమ్ ఆఫ్లైన్" : "VOICE SYSTEM OFFLINE"}
          </p>
        </div>

        {/* Sparkly visual cue */}
        {isListening && !wakeWordActive && (
          <div className="absolute top-2 right-2 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-[9px] text-brand-cyan font-mono">
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            <span>{language === "te" ? "ఐరి" : "Hey Airi"}</span>
          </div>
        )}
      </div>

      {/* Interim Transcribed Speech Box */}
      {isListening && transcriptText && (
        <div className="mt-3 bg-brand-black/80 border border-white/10 rounded-xl p-3 text-xs font-medium text-brand-cyan italic">
          &ldquo;{transcriptText}&rdquo;
        </div>
      )}

      {/* Voice Setup info */}
      <div className="mt-3.5 flex items-start space-x-2.5 bg-white/5 border border-white/10 rounded-xl p-3">
        <Volume2 className="h-4.5 w-4.5 text-brand-pink shrink-0 mt-0.5" />
        <div className="text-[11px] leading-normal text-white/60">
          {language === "te" ? (
            <>
              <span className="font-semibold text-white/80">వాయిస్ టోన్ ట్యూనింగ్:</span> ఐరి తెలుగులో మాట్లాడటానికి మరియు నవీన్ యొక్క శ్రద్ధను కాపాడటానికి సిద్ధంగా ఉంది. <strong>"ఐరి"</strong> అని పలకరించండి లేదా నేరుగా మాట్లాడండి!
            </>
          ) : (
            <>
              <span className="font-semibold text-white/80">Vocal Tone Tuning:</span> Airi uses high-pitch, fast formants to capture a cute anime assistant persona. Greet her with <strong className="text-brand-pink">"Hey Airi"</strong> or type/speak questions directly!
            </>
          )}
        </div>
      </div>
    </div>
  );
}
