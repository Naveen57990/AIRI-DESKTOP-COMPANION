export type Emotion =
  | "idle"
  | "happy"
  | "sad"
  | "excited"
  | "thinking"
  | "embarrassed"
  | "sleepy"
  | "angry"
  | "surprised"
  | "studying"
  | "distracted"
  | "sleeping";

export interface AiriState {
  emotion: Emotion;
  isSpeaking: boolean;
  position: { x: number; y: number };
  scale: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "airi";
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: string[];
}

export interface StudyGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface PomodoroState {
  minutes: number;
  seconds: number;
  isActive: boolean;
  isBreak: boolean;
  cyclesCompleted: number;
}

export interface DistractionLog {
  id: string;
  time: string;
  type: "Phone Usage" | "Social Media / Game" | "User Absence" | "Yawning / Fatigue" | "Other Person";
  duration: string;
  airiReaction: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "exam" | "study" | "assignment" | "other";
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface PDFSummary {
  title: string;
  summary: string;
  formulas: string[];
  flashcards: Flashcard[];
}

export interface MemoryProfile {
  userName: string;
  goals: string[];
  weakSubjects: string[];
  preferences: string;
  savedFacts: string[];
}
