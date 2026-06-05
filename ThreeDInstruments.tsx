import { useState } from "react";
import { Music } from "lucide-react";
import { NoteInfo } from "./audioEngine";

interface ThreeDInstrumentsProps {
  activeInstrument: "sine" | "triangle" | "square" | "guitar";
  musicalNotes: NoteInfo[];
  selectedComposerSlot: number;
  setSelectedComposerSlot: (idx: number) => void;
  onPlayNote: (note: NoteInfo) => void;
  slotNotesConfig: NoteInfo[];
  earnedMelody: (NoteInfo | null)[];
}

export default function ThreeDInstruments({
  activeInstrument,
  musicalNotes,
  selectedComposerSlot,
  setSelectedComposerSlot,
  onPlayNote,
  slotNotesConfig,
  earnedMelody,
}: ThreeDInstrumentsProps) {
  // Tracking local active playing animations
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [vibratingStrings, setVibratingStrings] = useState<Record<string, boolean>>({});
  const [swingingBells, setSwingingBells] = useState<Record<string, boolean>>({});
  const [pressedFlutes, setPressedFlutes] = useState<Record<string, boolean>>({});
  const [flashingPads, setFlashingPads] = useState<Record<string, boolean>>({});

  // Clean trigger effects
  const triggerInstrumentAnimation = (noteId: string) => {
    setPlayingNoteId(noteId);
    
    // 1. Guitar vibrational trigger
    setVibratingStrings((prev) => ({ ...prev, [noteId]: true }));
    setTimeout(() => {
      setVibratingStrings((prev) => ({ ...prev, [noteId]: false }));
    }, 850);

    // 2. Bell swing trigger
    setSwingingBells((prev) => ({ ...prev, [noteId]: true }));
    setTimeout(() => {
      setSwingingBells((prev) => ({ ...prev, [noteId]: false }));
    }, 1200);

    // 3. Flute key press trigger
    setPressedFlutes((prev) => ({ ...prev, [noteId]: true }));
    setTimeout(() => {
      setPressedFlutes((prev) => ({ ...prev, [noteId]: false }));
    }, 450);

    // 4. Arcade pads trigger
    setFlashingPads((prev) => ({ ...prev, [noteId]: true }));
    setTimeout(() => {
      setFlashingPads((prev) => ({ ...prev, [noteId]: false }));
    }, 400);
  };

  const handleInteract = (note: NoteInfo) => {
    triggerInstrumentAnimation(note.id);
    onPlayNote(note);
  };

  return (
    <div id="three_d_playground" className="glass-panel p-6 space-y-6 relative overflow-hidden">
      {/* Dynamic CSS animations styles tag inside the component to prevent template style leaks */}
      <style>{`
        @keyframes string-vibrate-fast {
          0% { transform: translateY(0) scaleY(1); }
          15% { transform: translateY(-4px) scaleY(1.08); }
          30% { transform: translateY(4px) scaleY(0.92); }
          45% { transform: translateY(-2px) scaleY(1.04); }
          60% { transform: translateY(2px) scaleY(0.96); }
          75% { transform: translateY(-1px) scaleY(1.02); }
          90% { transform: translateY(1px) scaleY(0.99); }
          100% { transform: translateY(0) scaleY(1); }
        }
        @keyframes bell-swing-realistic {
          0% { transform: rotate(0deg); transform-origin: top center; }
          15% { transform: rotate(18deg); transform-origin: top center; }
          30% { transform: rotate(-14deg); transform-origin: top center; }
          45% { transform: rotate(10deg); transform-origin: top center; }
          60% { transform: rotate(-6deg); transform-origin: top center; }
          75% { transform: rotate(3deg); transform-origin: top center; }
          90% { transform: rotate(-1deg); transform-origin: top center; }
          100% { transform: rotate(0deg); transform-origin: top center; }
        }
        @keyframes key-glow-pulse {
          0% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.85; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(1.8); }
        }
        .vibrate-active {
          animation: string-vibrate-fast 0.85s ease-in-out;
        }
        .swing-active {
          animation: bell-swing-realistic 1.2s ease-in-out;
        }
        .key-pulse {
          animation: key-glow-pulse 0.45s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      {/* Background Decorative Lighting */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Playground Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Music className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md font-extrabold uppercase font-sans">
                3D Playroom
              </span>
              {activeInstrument === "guitar" && <span className="text-[11px] text-amber-300 font-extrabold font-mono">🎸 REAL PLUCK</span>}
            </div>
            <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
              {activeInstrument === "guitar" && "Իսպանական կիթառի տախտակ"}
              {activeInstrument === "sine" && "Ֆլեյտայի օդային փողակ"}
              {activeInstrument === "triangle" && "Բյուրեղյա զանգակների կախիչ"}
              {activeInstrument === "square" && "Ռետրո 8-Bit սկավառակ"}
            </h3>
          </div>
        </div>

        {/* Selected slot recording badge indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-200">
            Ձայնագրում սլոթ <code className="text-emerald-300 font-mono font-black">#{selectedComposerSlot + 1}</code>-ում
          </span>
        </div>
      </div>

      {/* Slot quick select toolbar inside instrument for fast recording flow */}
      <div className="bg-slate-950/20 rounded-xl p-3 border border-white/5 space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight text-center md:text-left">
          Ընտրեք նոտայի դիրքը (սլոթ), ապա նվագեք գործիքը՝ այն լցնելու համար ։
        </p>
        <div className="flex flex-wrap gap-1 justify-center">
          {Array.from({ length: 20 }).map((_, idx) => {
            const hasNote = slotNotesConfig[idx] !== null;
            const hasEarned = earnedMelody[idx] !== null;
            const isSelected = idx === selectedComposerSlot;

            let badgeStyle = "bg-white/5 border-white/5 text-slate-400";
            if (hasEarned) {
              badgeStyle = "bg-indigo-500/15 border-indigo-500/20 text-indigo-300";
            }
            if (isSelected) {
              badgeStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 ring-2 ring-emerald-500/20";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedComposerSlot(idx)}
                className={`w-8 h-8 rounded-lg border text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${badgeStyle}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* CORE INSTRUMENTS VIEWS CONTAINER */}
      <div className="min-h-64 flex items-center justify-center p-2 rounded-2xl bg-slate-950/30 border border-white/5">
        
        {/* ==================== 1. CLASSICAL GUITAR 🎸 ==================== */}
        {activeInstrument === "guitar" && (
          <div className="w-full max-w-2xl py-6 px-4">
            <div className="relative bg-gradient-to-r from-amber-950 via-orange-950 to-amber-900 border-4 border-amber-950 rounded-2xl h-56 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex items-center">
              
              {/* Wooden Soundboard Grain Decor */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-stone-950/60 to-stone-950 pointer-events-none opacity-80" />
              
              {/* Guitar Soundhole */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 w-28 h-28 bg-stone-950 rounded-full border-4 border-amber-800/40 shadow-[inset_0_8px_20px_rgba(0,0,0,0.9)] flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full border border-orange-950/50 flex items-center justify-center">
                  <span className="text-amber-800/20 text-[10px] uppercase font-black tracking-widest font-serif leading-none rotate-12">CLASSICAL</span>
                </div>
              </div>

              {/* Metal Fret lines spaced out across neck */}
              <div className="absolute left-0 right-32 h-full flex justify-between pointer-events-none opacity-40">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-full border-r-2 border-stone-400 shadow-[1px_0_1px_rgba(255,255,255,0.4)]" />
                ))}
              </div>

              {/* 12 PLUCKABLE STRINGS */}
              <div className="w-full relative z-10 flex flex-col justify-between h-44 py-1">
                {musicalNotes.map((note, idx) => {
                  const isVibrating = vibratingStrings[note.id];
                  
                  // Varying string gauge (thickness) representing true gauges C4 (thick) to G5 (thin)
                  const stringGauge = Math.max(1, 4 - Math.floor(idx / 3.5));
                  
                  return (
                    <div 
                      key={note.id}
                      onClick={() => handleInteract(note)}
                      onMouseEnter={(e) => {
                        // Pluck on sliding over strings with mouse button held
                        if (e.buttons === 1) {
                          handleInteract(note);
                        }
                      }}
                      className="group relative cursor-pointer h-3 hover:bg-white/5 flex items-center transition-all select-none"
                    >
                      {/* Interactive String Pluck Trigger Area */}
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black font-mono tracking-tighter text-amber-500/40 opacity-0 group-hover:opacity-100 transition-all">
                        PLUCK
                      </span>

                      {/* Actual Physical String wire */}
                      <div 
                        style={{ height: `${stringGauge}px` }}
                        className={`w-full group-hover:brightness-125 transition-all relative ${
                          isVibrating ? "vibrate-active" : ""
                        } ${
                          playingNoteId === note.id 
                            ? "bg-indigo-300 shadow-[0_0_12px_#6366f1]" 
                            : "bg-gradient-to-r from-stone-400 via-yellow-105 to-stone-500"
                        }`}
                      />

                      {/* Interactive note dot label beside soundhole */}
                      <div className="absolute right-4 w-6 h-6 rounded-full bg-slate-900/90 border border-white/20 flex flex-col items-center justify-center text-[9px] font-black font-mono text-white pointer-events-none group-hover:scale-110 duration-150 shadow-md">
                        {note.letter}
                      </div>

                      {/* Wave flash pulse */}
                      {playingNoteId === note.id && (
                        <span className="absolute left-1/2 -translate-x-1/2 w-28 h-12 bg-indigo-500/25 blur-xl rounded-full key-pulse pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
            <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
              💡 <b>Հուշում.</b> Կարող եք կտտացնել կամ <b>սեղմած պահելով սահեցնել</b> մկնիկը՝ լարերը իրական կիթառի պես կենդանի հնչեցնելու համար ։
            </p>
          </div>
        )}

        {/* ==================== 2. WIND FLUTE 🌬️ ==================== */}
        {activeInstrument === "sine" && (
          <div className="w-full max-w-xl py-8 px-2">
            <div className="relative bg-gradient-to-b from-slate-200 via-slate-400 to-slate-200 border-t border-b border-white rounded-full h-14 shadow-xl flex items-center justify-around px-8">
              
              {/* Mouthpiece */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-10 bg-slate-300 rounded-l-lg border-2 border-slate-400/60 shadow-inner flex items-center justify-end pr-1.5 pointer-events-none">
                <div className="w-1.5 h-6 bg-slate-950 rounded-sm" />
              </div>

              {/* Air blow particles effect */}
              {playingNoteId && (
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-indigo-500/35 flex items-center justify-center key-pulse pointer-events-none" />
              )}

              {/* 12 Circular finger hole keys */}
              {musicalNotes.map((note) => {
                const isPressed = pressedFlutes[note.id];
                return (
                  <button
                    key={note.id}
                    onClick={() => handleInteract(note)}
                    className={`w-9 h-9 rounded-full border-2 border-stone-800 flex flex-col items-center justify-center relative select-none transform transition-all cursor-pointer shadow-md active:scale-95 active:translate-y-0.5 ${
                      isPressed
                        ? "bg-gradient-to-b from-indigo-500 to-indigo-700 text-white scale-95 border-indigo-400"
                        : "bg-gradient-to-b from-amber-200 via-yellow-100 to-amber-300 text-stone-900 hover:brightness-110"
                    }`}
                  >
                    <span className="text-[8px] font-black leading-none font-mono">{note.letter}</span>
                    <span className="text-[7px] font-bold leading-none mt-0.5">{note.name}</span>

                    {/* Radial aura ring when sound triggers */}
                    {playingNoteId === note.id && (
                      <span className="absolute inset-0 rounded-full bg-indigo-400/20 key-pulse pointer-events-none scale-150" />
                    )}
                  </button>
                );
              })}

              {/* Flute far end */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-12 bg-slate-500 rounded-r-full pointer-events-none" />
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-6 md:mt-8 font-medium">
              💨 Կտտացրեք փողային անցքերին՝ օդային ֆլեյտայի սեղմակները կառավարելու համար ։
            </p>
          </div>
        )}

        {/* ==================== 3. CRYSTAL BELLS 🔔 ==================== */}
        {activeInstrument === "triangle" && (
          <div className="w-full max-w-2xl py-6 px-1.5">
            {/* Wooden Stand Frame */}
            <div className="bg-gradient-to-r from-stone-800 to-stone-900 h-3 rounded-md w-full relative mb-1" />
            
            {/* Hanging bells chain row */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center">
              {musicalNotes.map((note) => {
                const isSwinging = swingingBells[note.id];
                return (
                  <div key={note.id} className="flex flex-col items-center select-none">
                    {/* Rope chain segment */}
                    <div className="w-0.5 h-6 bg-amber-750/70" />

                    {/* Bell Dome Shape with nice glassmorphism styles */}
                    <div
                      onClick={() => handleInteract(note)}
                      className={`w-11 h-16 bg-gradient-to-b from-teal-400/10 to-indigo-400/30 hover:to-indigo-500/40 border border-white/20 rounded-b-full shadow-lg relative flex flex-col items-center justify-end pb-2.5 cursor-pointer select-none transition-all ${
                        isSwinging ? "swing-active" : "hover:-translate-y-0.5"
                      }`}
                    >
                      {/* Bell Letter Label */}
                      <span className="text-[10px] font-black font-mono text-white leading-none tracking-tight">{note.letter}</span>
                      <span className="text-[8px] font-black text-indigo-300 leading-none mt-0.5">{note.name}</span>

                      {/* Small pendulum clapper */}
                      <div className="absolute -bottom-1 w-2.5 h-2.5 bg-indigo-300 rounded-full border border-indigo-400 shadow-sm transition-all" />

                      {/* Circle radiating wave */}
                      {playingNoteId === note.id && (
                        <span className="absolute inset-x-min -bottom-5 w-10 h-10 rounded-full border border-indigo-400/50 bg-indigo-500/5 key-pulse pointer-events-none" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
              🔔 Կտտացրեք զանգակներին՝ նրանց իրական 3D տատանումների և մեղեդիական զանգերի ձայնը լսելու համար ։
            </p>
          </div>
        )}

        {/* ==================== 4. RETRO DRUM SYNTH 👾 ==================== */}
        {activeInstrument === "square" && (
          <div className="w-full max-w-xl py-4 text-center space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 border-2 border-slate-950 shadow-2xl relative">
              
              {/* Retro Wave Oscilloscope screen */}
              <div className="bg-zinc-950 rounded-lg p-3 border border-indigo-500/40 h-14 relative overflow-hidden mb-4 flex items-center justify-center">
                <div className="absolute top-1 left-2 font-mono text-[8px] text-indigo-500 uppercase tracking-widest">Oscilloscope [Live]</div>
                
                {/* SVG wave grid */}
                <svg className="w-full h-8 opacity-75" viewBox="0 0 400 60">
                  <path
                    d={
                      playingNoteId
                        ? "M 0 30 Q 25 10 50 30 T 100 30 T 150 30 T 200 30 T 250 30 T 300 30 T 350 30 T 400 30"
                        : "M 0 30 L 400 30"
                    }
                    fill="none"
                    stroke={playingNoteId ? "#a78bfa" : "#312e81"}
                    strokeWidth="2.5"
                    className={playingNoteId ? "animate-pulse" : ""}
                  />
                </svg>
              </div>

              {/* 12 launchpads grid */}
              <div className="grid grid-cols-4 gap-2">
                {musicalNotes.map((note) => {
                  const isFlashing = flashingPads[note.id];
                  return (
                    <button
                      key={note.id}
                      onClick={() => handleInteract(note)}
                      className={`h-11 rounded-xl font-bold tracking-tight text-xs border border-slate-950 flex flex-col justify-center items-center select-none cursor-pointer transform transition-all active:translate-y-0.5 relative ${
                        isFlashing
                          ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                          : "bg-slate-850 hover:bg-slate-800 text-slate-300 shadow-inner"
                      }`}
                    >
                      <span className="font-mono text-[10px] font-black">{note.letter}</span>
                      <span className="text-[8px] text-slate-500 font-bold leading-none mt-0.5">{note.name}</span>
                      <div className={`absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full ${isFlashing ? "bg-amber-300" : "bg-indigo-950"}`} />
                    </button>
                  );
                })}
              </div>

            </div>
            <p className="text-center text-[10px] text-slate-400 font-medium">
              👾 Կառավարեք 8-Bit սկավառակի neon կրակապանները՝ ռետրո երաժշտության նմուշներ ստեղծելու համար ։
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
