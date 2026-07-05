import React, { useEffect, useRef, useState } from "react";
import { Camera, Shield, Eye, AlertTriangle, Play, Pause, RefreshCw, Sparkles } from "lucide-react";

interface VisionSystemProps {
  isStudyMode: boolean;
  onDistractionDetected: (
    type: "Phone Usage" | "Social Media / Game" | "User Absence" | "Yawning / Fatigue" | "Other Person",
    comment?: string
  ) => void;
  emotion: string;
  setEmotion: (emotion: any) => void;
  speakText: (text: string) => void;
  language?: "en" | "te";
  aiProvider?: "gemini" | "ollama";
  ollamaUrl?: string;
  ollamaModel?: string;
}

export default function VisionSystem({
  isStudyMode,
  onDistractionDetected,
  emotion,
  setEmotion,
  speakText,
  language = "en",
  aiProvider = "gemini",
  ollamaUrl = "http://localhost:11434",
  ollamaModel = "gemma2",
}: VisionSystemProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCamPermission, setHasCamPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(true);
  
  // Custom interactive simulation states for testing YOLO/MediaPipe alerts
  const [simulatedTarget, setSimulatedTarget] = useState<string>("none");
  const [analyzingFrame, setAnalyzingFrame] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isAutoDetectEnabled, setIsAutoDetectEnabled] = useState<boolean>(true);
  const [scannerInterval, setScannerInterval] = useState<number>(45); // Default 45s to protect free tier API limit
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Cooldown tracker for "Other Person" intrusion announcements (per person cooldown)
  const lastIntrusionAnnouncementRef = useRef<number>(0);

  // Keep track of last spoke for focused praise to prevent repetitive announcements
  const lastFocusedSpeakTimeRef = useRef<number>(0);

  // Initialize webcam
  useEffect(() => {
    if (!isCapturing) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let activeStream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        setHasCamPermission(true);
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn("Webcam permission denied or unavailable:", err);
        setHasCamPermission(false);
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCapturing]);

  // Real-time canvas overlay drawing (Face Mesh & Bounding Box Simulations)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const drawOverlay = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        // Draw the current camera frame as background mirror
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // Mirror effect
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 1. Draw static HUD overlay (high tech telemetry)
        ctx.fillStyle = "rgba(0, 242, 255, 0.15)";
        ctx.font = "10px monospace";
        ctx.fillText(`AIRI-VISION V2.4 // 60 FPS`, 15, 25);
        ctx.fillText(`POSTURE_TRACKER: ACTIVE`, 15, 40);
        ctx.fillText(`MODE: ${isStudyMode ? "FOCUS_SURVEILLANCE" : "IDLE"}`, 15, 55);

        // Draw crosshair
        ctx.strokeStyle = "rgba(0, 242, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
        ctx.moveTo(canvas.width / 2 - 60, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + 60, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, canvas.height / 2 - 60);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 + 60);
        ctx.stroke();

        // Simulate Face Mesh (MediaPipe landmark grid simulation)
        const faceX = canvas.width / 2 + Math.sin(Date.now() / 1500) * 15;
        const faceY = canvas.height / 2 - 10 + Math.cos(Date.now() / 2000) * 8;
        const faceW = 100;
        const faceH = 130;

        // Draw bounding box around user (Naveen)
        ctx.strokeStyle = "rgba(0, 242, 255, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(faceX - faceW / 2, faceY - faceH / 2, faceW, faceH);

        // Name tag
        ctx.fillStyle = "rgba(0, 242, 255, 0.85)";
        ctx.fillRect(faceX - faceW / 2 - 1, faceY - faceH / 2 - 20, 85, 20);
        ctx.fillStyle = "#050508";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText("User: Naveen", faceX - faceW / 2 + 5, faceY - faceH / 2 - 6);

        // Draw simulated eyes tracking dots
        ctx.fillStyle = "rgba(0, 242, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(faceX - 22, faceY - 18, 4, 0, Math.PI * 2);
        ctx.arc(faceX + 22, faceY - 18, 4, 0, Math.PI * 2);
        ctx.fill();

        // Gaze Direction line
        ctx.strokeStyle = "rgba(0, 242, 255, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(faceX - 22, faceY - 18);
        ctx.lineTo(faceX - 22 + Math.sin(Date.now() / 600) * 20, faceY - 18);
        ctx.moveTo(faceX + 22, faceY - 18);
        ctx.lineTo(faceX + 22 + Math.sin(Date.now() / 600) * 20, faceY - 18);
        ctx.stroke();

        // Draw Face Mesh lines (light geometric dots connected)
        ctx.strokeStyle = "rgba(0, 242, 255, 0.25)";
        ctx.lineWidth = 0.5;
        const pts = [
          { x: faceX, y: faceY - 50 }, // Forehead
          { x: faceX - 35, y: faceY - 15 }, // Left Brow
          { x: faceX + 35, y: faceY - 15 }, // Right Brow
          { x: faceX, y: faceY + 10 }, // Nose
          { x: faceX - 25, y: faceY + 30 }, // Left mouth
          { x: faceX + 25, y: faceY + 30 }, // Right mouth
          { x: faceX, y: faceY + 45 }, // Chin
        ];
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
          }
        }
        ctx.stroke();

        // 2. Draw Simulated Overlays based on state triggers (Phone, Fatigue, Intrusion)
        if (simulatedTarget === "phone") {
          // Phone box (YOLO detection)
          const pX = faceX + 80;
          const pY = faceY + 40;
          ctx.strokeStyle = "rgba(255, 45, 85, 0.9)"; // Brand pink alert
          ctx.lineWidth = 3;
          ctx.strokeRect(pX - 25, pY - 45, 50, 90);

          // Tag
          ctx.fillStyle = "rgba(255, 45, 85, 0.9)";
          ctx.fillRect(pX - 25, pY - 65, 95, 20);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px monospace";
          ctx.fillText("YOLO: PHONE 94%", pX - 20, pY - 51);

          // Connective distraction line
          ctx.strokeStyle = "rgba(255, 45, 85, 0.4)";
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(faceX, faceY);
          ctx.lineTo(pX, pY);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (simulatedTarget === "fatigue") {
          // Yawn mesh trigger
          ctx.strokeStyle = "rgba(245, 158, 11, 0.9)"; // Amber alert
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(faceX, faceY + 25, 14, 0, Math.PI * 2); // Mouth open yawning
          ctx.stroke();

          ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
          ctx.fillRect(faceX - 55, faceY + 45, 110, 18);
          ctx.fillStyle = "#000";
          ctx.font = "bold 9px monospace";
          ctx.fillText("FATIGUE: YAWN DETECTED", faceX - 50, faceY + 57);
        } else if (simulatedTarget === "intrusion") {
          // Another person in view box
          const intrX = 90;
          const intrY = faceY + 10;
          ctx.strokeStyle = "rgba(59, 130, 246, 0.9)"; // Blue info box
          ctx.lineWidth = 2.5;
          ctx.strokeRect(intrX - 40, intrY - 60, 80, 120);

          ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
          ctx.fillRect(intrX - 40, intrY - 80, 100, 20);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px monospace";
          ctx.fillText("YOLO: PERSON 91%", intrX - 35, intrY - 66);
        } else if (simulatedTarget === "slouch") {
          // Posture tracking lines
          ctx.strokeStyle = "rgba(255, 45, 85, 0.95)";
          ctx.lineWidth = 3;
          // Angled neck line showing slouch
          ctx.beginPath();
          ctx.moveTo(faceX, faceY + 45);
          ctx.lineTo(faceX - 25, faceY + 110);
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 45, 85, 0.95)";
          ctx.fillRect(faceX - 60, faceY + 120, 120, 18);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px monospace";
          ctx.fillText("POSTURE: SLOUCH ALERT", faceX - 55, faceY + 132);
        }
      } else {
        // Standby screen
        ctx.fillStyle = "#050508";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(0, 242, 255, 0.4)";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("VISION CAMERA FEED: STANDBY", canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = "10px monospace";
        ctx.fillText("Click 'Enable Feed' or select simulated alerts", canvas.width / 2, canvas.height / 2 + 15);
        ctx.textAlign = "start";
      }

      animId = requestAnimationFrame(drawOverlay);
    };

    drawOverlay();
    return () => cancelAnimationFrame(animId);
  }, [videoRef, isStudyMode, simulatedTarget]);

  // Triggers simulated computer vision events
  const triggerSimulation = (type: string) => {
    setSimulatedTarget(type);

    if (type === "phone") {
      setEmotion("distracted");
      const text = language === "te"
        ? "నవీన్, ఫోన్ పక్కన పెట్టు! మళ్ళీ చదువుకోవడంపై శ్రద్ధ పెట్టు!"
        : "Naveen, put your phone down! Let's get back to studying!";
      onDistractionDetected("Phone Usage", text);
      speakText(text); // Speak distraction immediately!
    } else if (type === "fatigue") {
      setEmotion("sleepy");
      const text = language === "te"
        ? "ఆవులింతలా, నవీన్? నీకు అలసటగా ఉందా? కాసేపు విరామం తీసుకో!"
        : "Yawn... Naveen, are you feeling tired? Let's take a quick stretch break!";
      onDistractionDetected("Yawning / Fatigue", text);
      speakText(text); // Speak distraction immediately!
    } else if (type === "slouch") {
      setEmotion("angry");
      const text = language === "te"
        ? "నవీన్, తిన్నగా కూర్చో! వెన్నుముక సరిగ్గా ఉంచడం చదువుకు చాలా ముఖ్యం!"
        : "Naveen, sit straight! Bad posture is bad for your back!";
      onDistractionDetected("Social Media / Game", text);
      speakText(text); // Speak distraction immediately!
    } else if (type === "intrusion") {
      // Cooldown check for other person intrusion announcement (5 second cooldown to prevent annoying loops)
      const now = Date.now();
      if (now - lastIntrusionAnnouncementRef.current > 5000) {
        lastIntrusionAnnouncementRef.current = now;
        const text = language === "te"
          ? "క్షమించండి. నవీన్ ఇప్పుడు చదువుకుంటున్నాడు. దయచేసి తనను ఇబ్బంది పెట్టకండి."
          : "Excuse me. Naveen is currently studying. Please avoid disturbing him if possible.";
        speakText(text);
        onDistractionDetected("Other Person", language === "te" ? "సందర్శకుడి నుండి గోప్యతను కోరారు." : "Politely requested study privacy from visitor.");
      }
    } else {
      setEmotion("studying");
    }
  };

  // Analyze webcam snapshot using Gemini multi-modal Vision!
  const captureAndAnalyze = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx || !videoRef.current) {
      setAnalysisResult(language === "te" ? "కెమెరా యాక్టివ్గా లేదు! మొదట ఆన్ చేయండి." : "Camera feed not active! Turn on feed first.");
      return;
    }

    setAnalyzingFrame(true);
    setAnalysisResult(language === "te" ? "ఫ్రేమ్ క్యాప్చర్ చేసి ఐరి సహాయాన్ని అడుగుతోంది..." : "Capturing frame & consulting Airi's visual center...");

    // Capture frame
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          language,
          aiProvider,
          ollamaUrl,
          ollamaModel,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setAnalyzingFrame(false);
      
      if (data.quotaExceeded) {
        setQuotaExceeded(true);
      } else {
        setQuotaExceeded(false);
      }
      
      if (data.comment) {
        setAnalysisResult(language === "te" ? `ఐరి చూస్తోంది: ${data.detection.toUpperCase()}! "${data.comment}"` : `Airi sees: ${data.detection.toUpperCase()}! "${data.comment}"`);
        
        // Handle announcement speech frequency
        const isDistracted = data.detection === "phone" || data.detection === "sleepy" || data.detection === "absent" || data.detection === "other_person";
        if (isDistracted) {
          // Say distractions IMMEDIATELY
          speakText(data.comment);
        } else {
          // Focused state: only praise/motivation once in a while (e.g. 15% probability and 120 seconds cooldown)
          const now = Date.now();
          if (now - lastFocusedSpeakTimeRef.current > 120000 && Math.random() < 0.15) {
            speakText(data.comment);
            lastFocusedSpeakTimeRef.current = now;
          }
        }

        // Map detection back to visual states
        if (data.detection === "phone") {
          triggerSimulation("phone");
        } else if (data.detection === "sleepy" || data.detection === "fatigue") {
          triggerSimulation("fatigue");
        } else if (data.detection === "absent") {
          setEmotion("sad");
          onDistractionDetected("User Absence", language === "te" ? "నవీన్ ఇక్కడ లేనట్లున్నారు... త్వరగా తిరిగి వస్తారని ఆశిస్తున్నాను!" : "Naveen seems to have walked away... Hope he returns soon!");
        } else if (data.detection === "other_person") {
          triggerSimulation("other_person");
        } else {
          setEmotion("happy");
          setSimulatedTarget("none");
        }
      }
    } catch (err) {
      console.error(err);
      setAnalyzingFrame(false);
      // Fallback locally on error or offline
      setQuotaExceeded(true);
      const offlineMsg = language === "te"
        ? "నవీన్, నువ్వు బాగా చదువుకుంటున్నావు! ఇలాగే శ్రద్ధగా ఉండు!"
        : "Naveen, you are looking focused! Keep up the great work!";
      setAnalysisResult(language === "te" ? `ఐరి లోకల్ చెక్: FOCUSED! "${offlineMsg}"` : `Airi local check: FOCUSED! "${offlineMsg}"`);
      
      // Let Airi say the supportive comment once in a while anyway!
      const now = Date.now();
      if (now - lastFocusedSpeakTimeRef.current > 120000 && Math.random() < 0.15) {
        speakText(offlineMsg);
        lastFocusedSpeakTimeRef.current = now;
      }
    }
  };

  // Keep latest captureAndAnalyze reference stable for our automatic interval
  const captureAndAnalyzeRef = useRef(captureAndAnalyze);
  useEffect(() => {
    captureAndAnalyzeRef.current = captureAndAnalyze;
  });

  // Keep latest triggerSimulation reference stable for our automatic interval
  const triggerSimulationRef = useRef(triggerSimulation);
  useEffect(() => {
    triggerSimulationRef.current = triggerSimulation;
  });

  // Hands-free Auto-Detect Scanner Loop (runs automatically every scannerInterval seconds)
  useEffect(() => {
    if (!isAutoDetectEnabled) return;

    const interval = setInterval(() => {
      if (isCapturing && hasCamPermission === true) {
        if (analyzingFrame) return;
        // Automatically capture the video element snapshot and send to Gemini Vision API
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          captureAndAnalyzeRef.current();
        }
      }
    }, scannerInterval * 1000); // Check automatically based on custom interval setting

    return () => clearInterval(interval);
  }, [isAutoDetectEnabled, isCapturing, hasCamPermission, analyzingFrame, scannerInterval]);

  return (
    <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan rounded-xl">
            <Camera className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">OpenCV + MediaPipe Vision Module</h3>
            <p className="text-xs text-white/60">Eye-tracking, Pose, Fatigue & Phone Detection</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsAutoDetectEnabled(!isAutoDetectEnabled)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              isAutoDetectEnabled
                ? "bg-brand-pink/15 border-brand-pink/30 text-brand-pink hover:bg-brand-pink/25"
                : "bg-brand-black border-white/10 text-white/40 hover:bg-white/5"
            }`}
            title="When active, Airi automatically monitors your posture, fatigue, and phone distractions hands-free."
          >
            <span className={`h-2 w-2 rounded-full relative flex`}>
              {isAutoDetectEnabled && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-pink opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoDetectEnabled ? "bg-brand-pink" : "bg-white/30"}`}></span>
            </span>
            <span>{isAutoDetectEnabled ? "Auto-Detect: ON" : "Auto-Detect: OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCapturing(!isCapturing)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isCapturing
                ? "bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/25"
                : "bg-brand-black border-white/10 text-white/85 hover:bg-white/5"
            }`}
          >
            {isCapturing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isCapturing ? "Pause Feed" : "Start Feed"}</span>
          </button>
        </div>
      </div>

      {/* Camera / Canvas feed box */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-brand-black shadow-inner group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Floating warning indicators overlay */}
        {simulatedTarget !== "none" && (
          <div className="absolute top-4 right-4 bg-brand-pink/90 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-brand-pink/50 flex items-center space-x-1.5 animate-bounce">
            <AlertTriangle className="h-4 w-4" />
            <span>AI_DISTRACTION_ALERT!</span>
          </div>
        )}

        {hasCamPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-black/90 text-center p-6">
            <Shield className="h-10 w-10 text-brand-pink mb-2.5" />
            <p className="text-sm font-medium text-white/90">Webcam Inaccessible</p>
            <p className="text-xs text-white/40 max-w-xs mt-1">
              Airi needs webcam access for live facial tracking and postural reminders. Enable webcam permissions or use the interactive triggers below!
            </p>
          </div>
        )}
      </div>

      {/* Telemetry Alert Simulator & Live Gemini analysis */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-brand-black/40 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-mono font-semibold text-white/40 mb-2 flex items-center uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-brand-pink mr-1.5" />
            CV TELEMETRY SIMULATOR:
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => triggerSimulation(simulatedTarget === "phone" ? "none" : "phone")}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-mono border text-center transition-colors cursor-pointer ${
                simulatedTarget === "phone"
                  ? "bg-brand-pink/20 border-brand-pink text-brand-pink"
                  : "bg-brand-black border-white/10 text-white/55 hover:border-brand-pink/40"
              }`}
            >
              [YOLO: PHONE]
            </button>
            <button
              type="button"
              onClick={() => triggerSimulation(simulatedTarget === "fatigue" ? "none" : "fatigue")}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-mono border text-center transition-colors cursor-pointer ${
                simulatedTarget === "fatigue"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-brand-black border-white/10 text-white/55 hover:border-amber-500/40"
              }`}
            >
              [YAWN ALERT]
            </button>
            <button
              type="button"
              onClick={() => triggerSimulation(simulatedTarget === "slouch" ? "none" : "slouch")}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-mono border text-center transition-colors cursor-pointer ${
                simulatedTarget === "slouch"
                  ? "bg-brand-pink/20 border-brand-pink text-brand-pink"
                  : "bg-brand-black border-white/10 text-white/55 hover:border-brand-pink/40"
              }`}
            >
              [BAD POSTURE]
            </button>
            <button
              type="button"
              onClick={() => triggerSimulation(simulatedTarget === "intrusion" ? "none" : "intrusion")}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-mono border text-center transition-colors cursor-pointer ${
                simulatedTarget === "intrusion"
                  ? "bg-brand-violet/20 border-brand-violet text-brand-violet"
                  : "bg-brand-black border-white/10 text-white/55 hover:border-brand-violet/40"
              }`}
            >
              [VISITOR DETECT]
            </button>
          </div>
        </div>

        <div className="bg-brand-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-white/40 mb-1 flex items-center uppercase tracking-wider">
              <Eye className="h-3.5 w-3.5 text-brand-cyan mr-1.5" />
              GEMINI MULTI-MODAL CV:
            </p>
            <p className="text-[10px] text-white/40 leading-tight">
              Captures a frame, extracts visual tokens, and lets Gemini analyze your environment!
            </p>
            
            {/* Custom Scan Frequency selector to let user manage comment rate & API usage */}
            <div className="mt-2.5 flex items-center justify-between bg-white/5 rounded-lg px-2 py-1 border border-white/5">
              <span className="text-[9px] font-mono text-white/50">
                {language === "te" ? "స్కాన్ ఫ్రీక్వెన్సీ:" : "Scan Frequency:"}
              </span>
              <select
                value={scannerInterval}
                onChange={(e) => setScannerInterval(Number(e.target.value))}
                className="bg-brand-black border border-white/10 rounded px-1 py-0.5 text-[9px] font-mono text-brand-cyan cursor-pointer outline-none"
              >
                <option value={15}>15s ({language === "te" ? "ఫాస్ట్" : "Fast"})</option>
                <option value={30}>30s</option>
                <option value={45}>45s ({language === "te" ? "మధ్యస్థం" : "Medium"})</option>
                <option value={60}>60s ({language === "te" ? "సిఫార్సు" : "Rec"})</option>
                <option value={120}>2m ({language === "te" ? "నెమ్మదిగా" : "Slow"})</option>
              </select>
            </div>
          </div>
          
          <button
            type="button"
            onClick={captureAndAnalyze}
            disabled={analyzingFrame || !isCapturing}
            className="w-full mt-2 flex items-center justify-center space-x-1 py-1.5 bg-gradient-to-r from-brand-pink to-brand-violet text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
          >
            {analyzingFrame ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            <span>{analyzingFrame ? "Analyzing..." : "Ask Gemini to Look"}</span>
          </button>
        </div>
      </div>

      {quotaExceeded && (
        <div className="mt-3 bg-brand-pink/10 border border-brand-pink/20 rounded-lg p-2.5 text-[10px] font-mono text-brand-pink flex items-start space-x-1.5">
          <span>⚠️</span>
          <span>
            {language === "te" 
              ? "గమనిక: ఉచిత గెమిని API కోటా ముగిసింది. ఐరి లోకల్ గార్డ్ మోడ్ మరియు సిమ్యులేటర్లు పూర్తిగా సక్రియంగా ఉన్నాయి!" 
              : "Airi Local Guard Active: Gemini Free Tier API limit reached. Screen triggers and manual simulators are fully functional!"}
          </span>
        </div>
      )}

      {analysisResult && (
        <div className="mt-3 bg-brand-black border border-white/10 rounded-lg p-2.5 text-[11px] font-mono text-brand-cyan animate-pulse leading-snug">
          &gt;_ {analysisResult}
        </div>
      )}
    </div>
  );
}
