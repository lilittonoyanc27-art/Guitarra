// Web Audio API-ի վրա հիմնված սինթեզատոր և նոտաների կառավարում
// Web Audio API based Synthesizer and Note Management

export interface NoteInfo {
  id: string;
  name: string; // Do, Re, Mi, etc.
  frequency: number;
  color: string; // Tailwind color class for interactive UI elements
  letter: string; // C4, D4, etc.
}

export const musicalNotes: NoteInfo[] = [
  { id: "C4", name: "Դո", frequency: 261.63, color: "bg-red-500 hover:bg-red-600 focus:ring-red-300", letter: "C4" },
  { id: "D4", name: "Ռե", frequency: 293.66, color: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300", letter: "D4" },
  { id: "E4", name: "Մի", frequency: 329.63, color: "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300", letter: "E4" },
  { id: "F4", name: "Ֆա", frequency: 349.23, color: "bg-green-500 hover:bg-green-600 focus:ring-green-300", letter: "F4" },
  { id: "G4", name: "Սոլ", frequency: 392.00, color: "bg-teal-500 hover:bg-teal-600 focus:ring-teal-300", letter: "G4" },
  { id: "A4", name: "Լա", frequency: 440.00, color: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300", letter: "A4" },
  { id: "B4", name: "Սի", frequency: 493.88, color: "bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-300", letter: "B4" },
  { id: "C5", name: "Դո 2", frequency: 523.25, color: "bg-purple-500 hover:bg-purple-600 focus:ring-purple-300", letter: "C5" },
  { id: "D5", name: "Ռե 2", frequency: 587.33, color: "bg-pink-500 hover:bg-pink-600 focus:ring-pink-300", letter: "D5" },
  { id: "E5", name: "Մի 2", frequency: 659.25, color: "bg-rose-500 hover:bg-rose-600 focus:ring-rose-300", letter: "E5" },
  { id: "F5", name: "Ֆա 2", frequency: 698.46, color: "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-300", letter: "F5" },
  { id: "G5", name: "Սոլ 2", frequency: 783.99, color: "bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-300", letter: "G5" }
];

export type InstrumentType = "sine" | "triangle" | "square" | "guitar";

export interface InstrumentConfig {
  id: InstrumentType;
  name: string;
  description: string;
  emoji: string;
}

export const instruments: InstrumentConfig[] = [
  { id: "guitar", name: "Իսպանական Կիթառ", description: "Կենդանի հնչողությամբ կլասիկ փայտե կիթառ", emoji: "🎸" },
  { id: "sine", name: "Օդային Ֆլեյտա", description: "Մեղմ, մաքուր և հանգիստ փողային ձայն", emoji: "🌬️" },
  { id: "triangle", name: "Բյուրեղյա Զանգակներ", description: "Տաք, մաքուր և զնգացող զանգակների ձայն", emoji: "🔔" },
  { id: "square", name: "8-Bit Արկադային Խաղ", description: "Ռետրո վիդեոխաղերի 8-Bit սինթեզատոր", emoji: "👾" }
];

let globalAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    // Standard AudioContext initialization
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  return globalAudioCtx;
}

// Physical acoustic nylon classical guitar pluck model
export function playGuitarTone(
  ctx: AudioContext,
  frequency: number,
  durationSec: number = 0.8,
  volume: number = 0.35
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();

  // Root tone uses standard triangle wave for thick/woody string body
  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Soft harmonics for resonance of classical guitar nylon strings
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(frequency * 2, ctx.currentTime);

  osc3.type = "sine";
  osc3.frequency.setValueAtTime(frequency * 3, ctx.currentTime);

  // Filter sweep represents dynamic sound damping of strings
  filterNode.type = "lowpass";
  filterNode.Q.setValueAtTime(1.2, ctx.currentTime);
  filterNode.frequency.setValueAtTime(1400, ctx.currentTime);
  filterNode.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + durationSec * 0.7);

  // High-precision pluck envelope: instant attack (10ms) -> exponential decay
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

  // Mix fundamental & harmonic volumes
  const volFund = ctx.createGain();
  volFund.gain.setValueAtTime(0.75, ctx.currentTime);
  osc1.connect(volFund);
  volFund.connect(filterNode);

  const volHarm1 = ctx.createGain();
  volHarm1.gain.setValueAtTime(0.22, ctx.currentTime);
  osc2.connect(volHarm1);
  volHarm1.connect(filterNode);

  const volHarm2 = ctx.createGain();
  volHarm2.gain.setValueAtTime(0.12, ctx.currentTime);
  osc3.connect(volHarm2);
  volHarm2.connect(filterNode);

  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start();
  osc2.start();
  osc3.start();

  osc1.stop(ctx.currentTime + durationSec);
  osc2.stop(ctx.currentTime + durationSec);
  osc3.stop(ctx.currentTime + durationSec);
}

// Play a single note
export function playTone(
  frequency: number,
  type: InstrumentType = "sine",
  durationSec: number = 0.4,
  volume: number = 0.3
) {
  if (frequency === 0) return; // Silent rest
  
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  // Handle custom guitar synthesis separately
  if (type === "guitar") {
    playGuitarTone(ctx, frequency, durationSec * 1.5, volume * 1.3);
    return;
  }

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Smooth standard envelope preventing clicks/pops
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.04);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime + durationSec - 0.08);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + durationSec);
}

// Helper to play success sound sequence
export function playSuccessChime() {
  playTone(523.25, "sine", 0.15, 0.25); // C5
  setTimeout(() => {
    playTone(659.25, "sine", 0.15, 0.25); // E5
  }, 100);
  setTimeout(() => {
    playTone(783.99, "sine", 0.25, 0.3); // G5
  }, 200);
}

// Helper to play failure sound sequence
export function playFailureDrone() {
  playTone(220.00, "guitar", 0.35, 0.35); // A3 string buzz
  setTimeout(() => {
    playTone(207.65, "guitar", 0.5, 0.35); // G#3 string buzz
  }, 150);
}
