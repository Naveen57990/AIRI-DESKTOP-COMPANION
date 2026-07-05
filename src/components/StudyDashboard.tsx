import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, RotateCcw, Award, Flame, Monitor, AlertTriangle, CheckSquare, Plus, Trash } from "lucide-react";
import { PomodoroState, DistractionLog, StudyGoal } from "../types";

interface StudyDashboardProps {
  isStudyMode: boolean;
  setIsStudyMode: (active: boolean) => void;
  distractionLogs: DistractionLog[];
  onAddDistractionLog: (type: "Phone Usage" | "Social Media / Game" | "User Absence" | "Yawning / Fatigue" | "Other Person", comments: string) => void;
  speakText: (text: string) => void;
  setEmotion: (emotion: any) => void;
  language?: "en" | "te";
}

export default function StudyDashboard({
  isStudyMode,
  setIsStudyMode,
  distractionLogs,
  onAddDistractionLog,
  speakText,
  setEmotion,
  language = "en",
}: StudyDashboardProps) {
  // Pomodoro state
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    minutes: 25,
    seconds: 0,
    isActive: false,
    isBreak: false,
    cyclesCompleted: 0,
  });

  // Active Subject goals
  const [goals, setGoals] = useState<StudyGoal[]>([
    { id: "1", title: "Review Quantum Mechanics notes", completed: false },
    { id: "2", title: "Complete Calculus Problem Set 3", completed: true },
    { id: "3", title: "Extract chemistry formulas with Airi", completed: false },
  ]);
  const [newGoalText, setNewGoalText] = useState("");

  // Simulated desktop app distraction tracker
  const [activeApp, setActiveApp] = useState<string>("VS Code (server.ts)");
  const appList = [
    "VS Code (server.ts)",
    "Chrome (Airi Compiler Docs)",
    "Chrome (YouTube - Chill Lofi Music)",
    "Minecraft (Version 1.20)",
    "Chrome (Reddit - r/reactjs)",
    "Terminal (npm run dev)",
  ];

  // Tick Pomodoro timer
  useEffect(() => {
    let timer: any = null;
    if (pomodoro.isActive) {
      timer = setInterval(() => {
        if (pomodoro.seconds > 0) {
          setPomodoro((prev) => ({ ...prev, seconds: prev.seconds - 1 }));
        } else if (pomodoro.minutes > 0) {
          setPomodoro((prev) => ({ ...prev, minutes: prev.minutes - 1, seconds: 59 }));
        } else {
          // Timer finished
          clearInterval(timer);
          const nextBreak = !pomodoro.isBreak;
          const nextMinutes = nextBreak ? 5 : 25;
          
          setPomodoro((prev) => ({
            minutes: nextMinutes,
            seconds: 0,
            isActive: false,
            isBreak: nextBreak,
            cyclesCompleted: prev.cyclesCompleted + (nextBreak ? 1 : 0),
          }));

          if (nextBreak) {
            const text = language === "te"
              ? "నవీన్, ఫోకస్ సెషన్ పూర్తయింది! ఐదు నిమిషాల పాటు విరామం తీసుకుందాం. నువ్వు చాలా బాగా చదివావు!"
              : "Focus session completed, Naveen! Let's take a 5-minute break together. You earned it!";
            speakText(text);
            setEmotion("happy");
          } else {
            const text = language === "te"
              ? "విరామ సమయం ముగిసింది, నవీన్! మళ్ళీ శ్రద్ధగా చదువుకోవడం ప్రారంభిద్దాం!"
              : "Break is over, Naveen! Let's get focused and study hard again!";
            speakText(text);
            setEmotion("studying");
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pomodoro, speakText, setEmotion, language]);

  // Handle manual/interval active app change
  const handleAppChange = (appName: string) => {
    setActiveApp(appName);
    if (!isStudyMode) return;

    // Trigger immediate companion distraction alarm if Naveen switches to distracting app
    if (
      appName.toLowerCase().includes("youtube") ||
      appName.toLowerCase().includes("reddit") ||
      appName.toLowerCase().includes("minecraft")
    ) {
      setEmotion("angry");
      const appNameClean = appName.split(" - ")[0];
      const text = language === "te"
        ? `నవీన్! ${appNameClean} ఎందుకు ఓపెన్ చేశావు? నువ్వు ఇప్పుడు చదువుకుంటున్నావు కదా! దానిని క్లోజ్ చేసి దృష్టి పెట్టు.`
        : `Naveen! Why is ${appNameClean} open? You're studying right now! Let's close it and focus.`;
      speakText(text);
      onAddDistractionLog("Social Media / Game", `Caught accessing ${appName}`);
    } else {
      setEmotion("studying");
    }
  };

  // Handle app switching simulation
  useEffect(() => {
    if (!isStudyMode) return;

    const productiveApps = [
      "VS Code (server.ts)",
      "Chrome (Airi Compiler Docs)",
      "Terminal (npm run dev)",
    ];

    // Periodically cycle through productive apps so user isn't falsely flagged as distracted
    const interval = setInterval(() => {
      const randomApp = productiveApps[Math.floor(Math.random() * productiveApps.length)];
      setActiveApp(randomApp);
    }, 35000); // Check every 35 seconds

    return () => clearInterval(interval);
  }, [isStudyMode]);

  // Toggle study mode
  const toggleStudyMode = () => {
    const nextMode = !isStudyMode;
    setIsStudyMode(nextMode);
    
    if (nextMode) {
      setEmotion("studying");
      const text = language === "te"
        ? "స్టడీ ఫోకస్ మోడ్ ప్రారంభించబడింది, నవీన్. నీ దృష్టిని కాపాడటానికి నేను సహాయం చేస్తాను. చదువుదాం రండి!"
        : "Study focus mode enabled, Naveen. I will monitor your screen and camera for distractions. Let's do our best!";
      speakText(text);
      setPomodoro((prev) => ({ ...prev, isActive: true }));
    } else {
      setEmotion("idle");
      const text = language === "te"
        ? "ఫోకస్ మోడ్ నిలిపివేయబడింది. చాలా బాగా చేసావు, నవీన్! కాసేపు విశ్రాంతి తీసుకో."
        : "Focus mode deactivated. Great job, Naveen! Take some rest.";
      speakText(text);
      setPomodoro((prev) => ({ ...prev, isActive: false }));
    }
  };

  // Add study goal
  const addGoal = () => {
    if (!newGoalText.trim()) return;
    setGoals((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newGoalText, completed: false },
    ]);
    setNewGoalText("");
  };

  // Toggle goal complete
  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  // Delete goal
  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Pane: Pomodoro, App Tracker & Study Trigger */}
      <div className="lg:col-span-1 flex flex-col space-y-6">
        {/* Toggle Mode box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold text-brand-pink uppercase tracking-widest">
                Focus Core Monitor
              </span>
              <span className={`inline-block h-2 w-2 rounded-full ${isStudyMode ? "bg-brand-cyan animate-ping" : "bg-white/20"}`} />
            </div>
            <h3 className="text-sm font-semibold text-white">Study Surveillance Engine</h3>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              When study mode is on, Airi tracks active windows and uses computer vision to detect phone usage, fatigue yawnings, and slouching.
            </p>
          </div>

          <button
            onClick={toggleStudyMode}
            className={`w-full mt-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
              isStudyMode
                ? "bg-brand-pink hover:bg-brand-pink/90 text-white"
                : "bg-brand-cyan hover:bg-brand-cyan/90 text-brand-black"
            }`}
          >
            {isStudyMode ? "Deactivate Study Mode" : "Activate Study Mode"}
          </button>
        </div>

        {/* Pomodoro Timer Widget */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <span className="text-[10px] font-mono font-bold text-brand-pink uppercase tracking-widest mb-2 block">
            Pomodoro Cycles
          </span>
          <div className="flex flex-col items-center justify-center py-4 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-3xl font-mono font-bold text-white tracking-wider">
              {String(pomodoro.minutes).padStart(2, "0")}:{String(pomodoro.seconds).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase mt-1">
              {pomodoro.isBreak ? "Break Interval" : "Study Interval"}
            </span>

            {/* Controls */}
            <div className="flex items-center space-x-3.5 mt-4">
              <button
                onClick={() => setPomodoro((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className="p-2 bg-brand-black border border-white/10 hover:border-brand-pink text-white rounded-lg transition-colors cursor-pointer"
              >
                {pomodoro.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setPomodoro({ minutes: pomodoro.isBreak ? 5 : 25, seconds: 0, isActive: false, isBreak: pomodoro.isBreak, cyclesCompleted: pomodoro.cyclesCompleted })}
                className="p-2 bg-brand-black border border-white/10 hover:border-brand-pink text-white rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-center">
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
              <span className="block text-sm font-semibold text-white/90">{pomodoro.cyclesCompleted}</span>
              <span className="text-[9px] font-mono text-white/40 uppercase">Completed</span>
            </div>
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center space-x-1.5">
              <Flame className="h-4 w-4 text-brand-pink animate-pulse" />
              <div>
                <span className="block text-sm font-semibold text-white/90">5 Days</span>
                <span className="text-[9px] font-mono text-white/40 uppercase">Streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Desktop App Monitor */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 backdrop-blur-md">
          <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center">
            <Monitor className="h-4 w-4 text-brand-pink mr-1.5" />
            MacBook Active App
          </p>
          <div className="p-3 bg-brand-black border border-white/10 rounded-xl">
            <span className="block text-xs font-mono text-white/90 truncate">{activeApp}</span>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10">
              <span className="text-[9px] text-white/40 font-mono">STATUS:</span>
              <span className={`text-[9px] font-mono font-bold uppercase ${
                activeApp.toLowerCase().includes("youtube") || activeApp.toLowerCase().includes("reddit") || activeApp.toLowerCase().includes("minecraft")
                  ? "text-brand-pink"
                  : "text-brand-cyan"
              }`}>
                {activeApp.toLowerCase().includes("youtube") || activeApp.toLowerCase().includes("reddit") || activeApp.toLowerCase().includes("minecraft")
                  ? "DISTRACTED!"
                  : "PRODUCTIVE"}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <span className="block text-[8px] font-mono text-white/30 mb-1.5 uppercase tracking-wider">
              Simulate Desktop Window Switch:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {appList.map((app) => (
                <button
                  key={app}
                  type="button"
                  onClick={() => handleAppChange(app)}
                  className={`px-1.5 py-1 text-[8.5px] font-mono border rounded text-left truncate transition-all cursor-pointer ${
                    activeApp === app
                      ? "bg-brand-pink/20 border-brand-pink text-brand-pink"
                      : "bg-brand-black/40 border-white/10 text-white/40 hover:border-brand-pink/30 hover:text-white"
                  }`}
                  title={`Click to simulate opening ${app}`}
                >
                  {app.split(" - ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Pane: Study Goals Objective Checklist */}
      <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-brand-pink uppercase tracking-widest mb-3.5 block">
            Focus Checklist
          </span>

          <div className="space-y-2.5">
            {goals.map((g) => (
              <div
                key={g.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  g.completed
                    ? "bg-white/5 border-white/5 text-white/40 opacity-60 line-through"
                    : "bg-brand-black border-white/10 text-white/90"
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <input
                    type="checkbox"
                    checked={g.completed}
                    onChange={() => toggleGoal(g.id)}
                    className="h-4.5 w-4.5 accent-brand-pink bg-brand-black border border-white/10 rounded cursor-pointer"
                  />
                  <span className="text-xs truncate font-medium">{g.title}</span>
                </div>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="text-white/40 hover:text-brand-pink transition-colors p-1 cursor-pointer"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add goal */}
        <div className="mt-6 flex items-center space-x-2">
          <input
            type="text"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="Add new study goal..."
            className="flex-1 bg-brand-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-brand-pink"
          />
          <button
            onClick={addGoal}
            className="p-3 bg-brand-pink text-white rounded-xl hover:bg-brand-pink/90 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Right Pane: Screen/CV Live Distraction Log History */}
      <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
        <span className="text-[10px] font-mono font-bold text-brand-pink uppercase tracking-widest mb-4 block">
          Distraction Surveillance Log
        </span>

        {distractionLogs.length > 0 ? (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {distractionLogs.map((log) => (
              <div
                key={log.id}
                className="bg-brand-black border border-white/10 rounded-xl p-3 text-xs flex flex-col space-y-1.5"
              >
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-brand-pink font-bold flex items-center space-x-1">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-white/40">{log.time}</span>
                </div>
                <p className="text-white/80 font-medium">{log.airiReaction}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[320px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center p-6 text-white/40">
            <Award className="h-10 w-10 text-white/10 mb-2" />
            <h5 className="text-xs font-semibold text-white/60">Zero Distractions!</h5>
            <p className="text-[11px] text-white/40 max-w-xs mt-1">
              Fabulous! No focus interruptions logged yet during this Pomodoro cycle. Keep working!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
