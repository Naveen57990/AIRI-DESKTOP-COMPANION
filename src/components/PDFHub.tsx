import React, { useState } from "react";
import { BookOpen, FileText, CheckCircle, RefreshCw, Layers, Eye, Zap, Copy } from "lucide-react";
import { PDFSummary, Flashcard } from "../types";

interface PDFHubProps {
  aiProvider?: "gemini" | "ollama";
  ollamaUrl?: string;
  ollamaModel?: string;
}

export default function PDFHub({
  aiProvider = "gemini",
  ollamaUrl = "http://localhost:11434",
  ollamaModel = "gemma2",
}: PDFHubProps) {
  const [pasteText, setPasteText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [summaryData, setSummaryData] = useState<PDFSummary | null>(null);
  
  // Flashcard flipping state
  const [flippedCards, setFlippedCards] = useState<{ [id: string]: boolean }>({});

  const handleFlip = (cardId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleAnalyze = async (textToAnalyze: string, name: string = "Paste Notes") => {
    if (!textToAnalyze.trim()) return;

    setAnalyzing(true);

    try {
      const response = await fetch("/api/pdf/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textContent: textToAnalyze,
          fileName: name,
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
      setSummaryData(data);
    } catch (err: any) {
      console.error(err);
      alert(`Error parsing notes: ${err.message || err}. Ensure your AI engine is active and running.`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Sample templates to let users instantly test the analyzer
  const samples = [
    {
      title: "Quantum Physics & Wave Mechanics",
      text: "The wave-particle duality represents the concept that every particle or quantum entity may be described as either a particle or a wave. It addresses the inability of classical concepts like particle or wave to fully describe quantum scale behavior. The central equation is the Schrödinger equation describing wavefunctions: iℏ ∂/∂t Ψ(x,t) = Ĥ Ψ(x,t) where H is the Hamiltonian. Max Planck's relation connects energy to frequency via E = hν.",
    },
    {
      title: "Cellular Respiration & Krebs Cycle",
      text: "Cellular respiration is a set of metabolic reactions taking place in cells to convert biochemical energy from nutrients into ATP. Adenosine triphosphate (ATP) is the energy currency of the cell. The cycle converts acetyl-CoA into carbon dioxide, producing NADH, FADH2, and GTP. The total yield per glucose molecule is approximately 30 to 32 ATP molecules depending on shuttle efficiency.",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Input panel (Pasted text or Upload Simulation) */}
      <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-brand-pink/15 border border-brand-pink/30 text-brand-pink rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">PDF & Study Notes Analyzer</h3>
              <p className="text-xs text-white/60">Extract equations, summarize, and study</p>
            </div>
          </div>

          <p className="text-xs text-white/50 mb-4 leading-relaxed">
            Paste lecture notes, study articles, or textbook extracts below, or select a pre-loaded template to watch Airi process formulas and compile flashcard desks.
          </p>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your study notes, formulas, or textbook chapters here..."
            className="w-full h-48 bg-brand-black border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-brand-pink transition-colors resize-none font-sans"
          />

          {/* Quick Samples */}
          <div className="mt-4">
            <p className="text-[10px] font-mono font-semibold text-white/40 mb-2 uppercase tracking-wider">QUICK SAMPLE TEMPLATES:</p>
            <div className="grid grid-cols-1 gap-2">
              {samples.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPasteText(sample.text);
                    handleAnalyze(sample.text, sample.title);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-brand-black border border-white/10 text-left hover:border-brand-pink/50 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-medium text-white/80 truncate mr-2">{sample.title}</span>
                  <Zap className="h-3 w-3 text-brand-cyan shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleAnalyze(pasteText)}
          disabled={analyzing || !pasteText.trim()}
          className="w-full mt-6 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-brand-pink to-brand-violet text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer"
        >
          {analyzing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing Documents...</span>
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4" />
              <span>Analyze & Generate Flashcards</span>
            </>
          )}
        </button>
      </div>

      {/* Results panel (Airi's Summary, Formulas & Flashcards) */}
      <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl">
        {summaryData ? (
          <div className="space-y-6">
            {/* Title / Airi Summary block */}
            <div className="bg-brand-black border border-white/10 rounded-xl p-4.5">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <span className="text-[10px] font-mono font-bold text-brand-pink uppercase tracking-wider">
                  AIRI_COGNITIVE_SUMMARY
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  {summaryData.title || "Lecture Notes"}
                </span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed italic">
                &ldquo;{summaryData.summary}&rdquo;
              </p>
            </div>

            {/* Extracted formula math blocks */}
            {summaryData.formulas && summaryData.formulas.length > 0 && (
              <div>
                <h4 className="text-[10px] font-mono font-bold text-white/45 mb-2.5 uppercase tracking-wider">
                  // Extracted Formula Blocks
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summaryData.formulas.map((form, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-brand-black border border-white/10 rounded-lg text-xs font-mono text-brand-cyan flex items-center space-x-2"
                    >
                      <span>{form}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flashcard Desk */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Layers className="h-4 w-4 text-brand-pink" />
                <h4 className="text-[10px] font-mono font-bold text-white/45 uppercase tracking-wider">
                  Interactive Flashcard Desk
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {summaryData.flashcards.map((card) => {
                  const isFlipped = flippedCards[card.id] || false;
                  return (
                    <div
                      key={card.id}
                      onClick={() => handleFlip(card.id)}
                      className="h-32 [perspective:1000px] cursor-pointer group"
                    >
                      <div
                        className={`relative w-full h-full rounded-xl transition-all duration-500 [transform-style:preserve-3d] ${
                          isFlipped ? "[transform:rotateY(180deg)]" : ""
                        }`}
                      >
                        {/* Front Side */}
                        <div className="absolute inset-0 w-full h-full bg-brand-black hover:bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between [backface-visibility:hidden]">
                          <div className="flex justify-between items-center text-[9px] font-mono text-brand-pink uppercase tracking-wider">
                            <span>Question Card</span>
                            <Zap className="h-3 w-3" />
                          </div>
                          <p className="text-[11px] font-medium text-white/90 line-clamp-3 mb-1">
                            {card.question}
                          </p>
                          <span className="text-[9px] font-mono text-white/30 group-hover:text-brand-pink transition-colors text-right">
                            Click to reveal answer &rarr;
                          </span>
                        </div>

                        {/* Back Side */}
                        <div className="absolute inset-0 w-full h-full bg-brand-black border border-brand-cyan/40 rounded-xl p-4 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
                          <div className="flex justify-between items-center text-[9px] font-mono text-brand-cyan uppercase tracking-wider">
                            <span>Airi's Verification</span>
                            <CheckCircle className="h-3 w-3" />
                          </div>
                          <p className="text-[11px] text-white/90 leading-relaxed line-clamp-4">
                            {card.answer}
                          </p>
                          <span className="text-[9px] font-mono text-brand-cyan/70 text-right">
                            Click to flip back &larr;
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[430px] border border-dashed border-white/10 bg-brand-black/20 rounded-xl flex flex-col items-center justify-center p-6 text-center">
            <BookOpen className="h-12 w-12 text-white/20 mb-3 animate-pulse" />
            <h4 className="text-sm font-semibold text-white/80">Awaiting Study Notes</h4>
            <p className="text-xs text-white/40 max-w-xs mt-1">
              Select one of the sample topics on the left or paste in your custom course logs. Airi will compile summaries and design flashcards for you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
