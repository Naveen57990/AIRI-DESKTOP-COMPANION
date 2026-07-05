import React, { useState } from "react";
import { Calendar, Clock, Plus, Tag, AlertCircle, CheckCircle } from "lucide-react";
import { CalendarEvent } from "../types";

export default function CalendarScheduler() {
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "1", title: "Quantum Physics Midterm Exam", date: "2026-07-18", time: "10:30 AM", type: "exam" },
    { id: "2", title: "Calculus PSET-3 Draft Submission", date: "2026-07-10", time: "11:59 PM", type: "assignment" },
    { id: "3", title: "Organic Chemistry Group Study", date: "2026-07-06", time: "02:00 PM", type: "study" },
    { id: "4", title: "Vector Calculus Focus review", date: "2026-07-08", time: "04:30 PM", type: "study" },
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("2026-07-05");
  const [newTime, setNewTime] = useState("12:00 PM");
  const [newType, setNewType] = useState<"exam" | "study" | "assignment" | "other">("study");

  const addEvent = () => {
    if (!newTitle.trim()) return;
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        date: newDate,
        time: newTime,
        type: newType,
      },
    ]);
    setNewTitle("");
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-brand-pink/15 text-brand-pink border border-brand-pink/20";
      case "assignment":
        return "bg-brand-violet/15 text-brand-violet border border-brand-violet/20";
      case "study":
        return "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20";
      default:
        return "bg-white/10 text-white/50 border border-white/10";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Event scheduler form */}
      <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center space-x-3 mb-4.5">
            <div className="p-2.5 bg-brand-pink/15 border border-brand-pink/30 text-brand-pink rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Calendar Scheduler</h3>
              <p className="text-xs text-white/60">Schedule examinations & study blocks</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">Event Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Physics exam review, Calculus submission..."
                className="w-full bg-brand-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-pink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">Time</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">Event Category</label>
              <div className="grid grid-cols-2 gap-2">
                {(["study", "exam", "assignment", "other"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewType(type)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-colors capitalize cursor-pointer ${
                      newType === type
                        ? "bg-brand-pink/15 border-brand-pink text-brand-pink"
                        : "bg-brand-black border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={addEvent}
          className="w-full mt-6 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-brand-pink to-brand-violet text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-colors shadow-lg cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Schedule Block</span>
        </button>
      </div>

      {/* Events timeline lists */}
      <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between shadow-2xl">
        <div className="space-y-4 w-full">
          <span className="text-xs font-mono font-bold text-brand-pink uppercase tracking-wider block">
            Upcoming Semester Timeline
          </span>

          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {events
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((ev) => (
                <div
                  key={ev.id}
                  className="bg-brand-black border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50">
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white/90">{ev.title}</h4>
                      <div className="flex items-center space-x-2.5 text-[10px] text-white/40 font-mono mt-1">
                        <span>{ev.date}</span>
                        <span>•</span>
                        <span>{ev.time}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wide self-start sm:self-center ${getBadgeStyle(ev.type)}`}>
                    {ev.type}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-6 flex items-center space-x-2 bg-brand-black/35 border border-white/10 rounded-xl p-3 text-white/50 text-xs">
          <AlertCircle className="h-4.5 w-4.5 text-brand-pink shrink-0" />
          <span>Airi monitors exam milestones and will run automated revision countdown loops 3 days prior.</span>
        </div>
      </div>
    </div>
  );
}
