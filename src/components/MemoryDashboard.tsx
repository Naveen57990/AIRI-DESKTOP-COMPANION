import React, { useState } from "react";
import { Database, Search, Sparkles, Brain, Plus, User, Target, Clipboard, Heart } from "lucide-react";
import { MemoryProfile } from "../types";

export default function MemoryDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [profile, setProfile] = useState<MemoryProfile>({
    userName: "Naveen",
    goals: [
      "Master Quantum Wave Mechanics formulas",
      "Develop local OpenCV-MediaPipe vision wrappers",
      "Maintain 5-day continuous focus streak",
    ],
    weakSubjects: ["Cellular Respiration shuttles", "Organic Chemistry mechanisms"],
    preferences: "Likes studying with warm chill-hop music; gets sleepy around 4:00 PM; prefers motivational encouragements over strict warnings.",
    savedFacts: [
      "Naveen's physics exam is on July 18th, 2026.",
      "Airi likes helping Naveen study and sips virtual matcha tea when thinking.",
      "Naveen dislikes noisy surroundings; Airi runs local echo cancellations.",
      "Naveen's favorite snack is roasted almond butter.",
      "Weak chemistry subjects: Aldehyde nucleophilic addition formulas.",
    ],
  });

  const [newGoal, setNewGoal] = useState("");
  const [newWeak, setNewWeak] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Simulate semantic vector DB lookup
    const qLower = query.toLowerCase();
    const matches = profile.savedFacts.filter(
      (fact) => fact.toLowerCase().includes(qLower) || qLower.includes("match")
    );
    setSearchResults(matches);
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setProfile((prev) => ({ ...prev, goals: [...prev.goals, newGoal.trim()] }));
    setNewGoal("");
  };

  const addWeak = () => {
    if (!newWeak.trim()) return;
    setProfile((prev) => ({ ...prev, weakSubjects: [...prev.weakSubjects, newWeak.trim()] }));
    setNewWeak("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Profile & Memory State card */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl">
          <div className="flex items-center space-x-3 mb-4.5">
            <div className="p-2.5 bg-brand-pink/15 border border-brand-pink/30 text-brand-pink rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Companion Memory Core</h3>
              <p className="text-xs text-white/60">SQLite + Persistent Storage profile</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-brand-black/40 border border-white/10 rounded-xl p-3">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">STUDENT PROFILE</span>
              <span className="text-sm font-semibold text-white mt-1 block">{profile.userName}</span>
            </div>

            <div className="bg-brand-black/40 border border-white/10 rounded-xl p-3">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block flex items-center mb-1">
                <Heart className="h-3 w-3 text-brand-pink mr-1" />
                LEARNER PREFERENCES
              </span>
              <p className="text-xs text-white/60 leading-relaxed font-sans">{profile.preferences}</p>
            </div>

            {/* Visual Subject Mastery indicators */}
            <div className="bg-brand-black/40 border border-white/10 rounded-xl p-3">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-2">SUBJECT MASTERY CURVES</span>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-white/50 font-mono mb-1">
                    <span>Wave Mechanics</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-black rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-brand-pink to-brand-cyan h-full rounded-full" style={{ width: "88%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-white/50 font-mono mb-1">
                    <span>Krebs Cycle Bio-chems</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-black rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-brand-pink to-brand-cyan h-full rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Search & Goals checklist */}
      <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl flex flex-col justify-between space-y-6">
        <div>
          {/* Vector DB Search Section */}
          <div className="bg-brand-black border border-white/10 rounded-xl p-4.5 mb-6">
            <span className="text-xs font-mono font-bold text-brand-pink uppercase tracking-wide flex items-center mb-3">
              <Database className="h-4 w-4 mr-1.5" />
              Vector DB Memory Retrieval
            </span>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Query Airi's memory context (e.g. 'exam', 'matcha', 'snack')..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-pink"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
            </div>

            {/* Results listing */}
            {searchQuery && (
              <div className="mt-4 border-t border-white/10 pt-3 space-y-2">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  SEMANTIC MATCHES RETRIEVED:
                </p>
                {searchResults.length > 0 ? (
                  searchResults.map((res, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2.5 bg-brand-pink/10 border border-brand-pink/25 rounded-lg text-xs font-mono text-brand-pink flex items-center space-x-2"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-brand-pink shrink-0" />
                      <span>{res}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-white/40 italic">No semantic blocks matching &quot;{searchQuery}&quot; found.</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject milestones / Goals */}
            <div>
              <span className="text-xs font-mono font-bold text-white/50 uppercase tracking-wider mb-2.5 flex items-center">
                <Target className="h-4 w-4 text-brand-pink mr-1.5" />
                Semester Key Milestones
              </span>
              <div className="space-y-2">
                {profile.goals.map((g, idx) => (
                  <div key={idx} className="p-3 bg-brand-black border border-white/10 rounded-xl text-xs text-white/80 font-sans">
                    {g}
                  </div>
                ))}
                <div className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add milestone..."
                    className="flex-1 bg-brand-black border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-pink"
                  />
                  <button type="button" onClick={addGoal} className="px-3 bg-brand-black border border-white/15 hover:bg-white/5 text-white/90 rounded-xl text-xs cursor-pointer">
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Weak topics / Areas of struggle */}
            <div>
              <span className="text-xs font-mono font-bold text-white/50 uppercase tracking-wider mb-2.5 flex items-center">
                <Brain className="h-4 w-4 text-brand-cyan mr-1.5" />
                Areas to Strengthen
              </span>
              <div className="space-y-2">
                {profile.weakSubjects.map((w, idx) => (
                  <div key={idx} className="p-3 bg-brand-black border border-white/10 rounded-xl text-xs text-white/80 font-sans flex items-center justify-between">
                    <span>{w}</span>
                    <span className="text-[9px] font-mono text-brand-cyan bg-brand-cyan/15 px-1.5 py-0.5 rounded border border-brand-cyan/30">Weak</span>
                  </div>
                ))}
                <div className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    value={newWeak}
                    onChange={(e) => setNewWeak(e.target.value)}
                    placeholder="Add struggle topic..."
                    className="flex-1 bg-brand-black border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-pink"
                  />
                  <button type="button" onClick={addWeak} className="px-3 bg-brand-black border border-white/15 hover:bg-white/5 text-white/90 rounded-xl text-xs cursor-pointer">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Stats footer */}
        <div className="flex items-center space-x-3 bg-brand-black/35 border border-white/10 rounded-xl p-3 text-white/50 text-xs">
          <Clipboard className="h-5 w-5 text-brand-pink shrink-0" />
          <span>Persistent schema matches are synced to SQLite `memory.db` & a vector storage array securely, allowing Airi to recall custom conversations without token overflows.</span>
        </div>
      </div>
    </div>
  );
}
