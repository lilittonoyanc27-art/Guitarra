import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Music, 
  Search, 
  Award, 
  BookOpen, 
  HelpCircle, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ChevronRight, 
  Info, 
  Sliders, 
  Keyboard, 
  Check, 
  Book 
} from "lucide-react";

import { 
  numberDatabase, 
  theoryLessons, 
  getArmenianNumberName, 
  getSpanishNumberName, 
  NumberItem 
} from "./dictionary";

import { 
  musicalNotes, 
  instruments, 
  playTone, 
  getAudioContext, 
  playSuccessChime, 
  playFailureDrone, 
  NoteInfo, 
  InstrumentType 
} from "./audioEngine";

import ThreeDInstruments from "./ThreeDInstruments";

// Define structures
interface QuizQuestion {
  targetNumber: number;
  armenianName: string;
  correctSpanish: string;
  options: string[]; // 4 shuffled options
}

export default function App() {
  // Tabs: 'theory' | 'quiz' | 'melody'
  const [activeTab, setActiveTab] = useState<"theory" | "quiz" | "melody">("quiz");
  
  // Audio configuration
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentType>("guitar");
  const [tempoBpm, setTempoBpm] = useState(120);
  const [isLooping, setIsLooping] = useState(false);
  
  // Quiz states
  const [quizState, setQuizState] = useState<"not_started" | "playing" | "answered" | "finished">("not_started");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  
  // Selection state for notes mapping
  const [nextNoteToEarn, setNextNoteToEarn] = useState<NoteInfo>(musicalNotes[0]); // Default C4 (Do)
  
  // User's custom composed melody (array of 20 note elements or null for mistakes/silences)
  const [earnedMelody, setEarnedMelody] = useState<(NoteInfo | null)[]>(Array(20).fill(null));
  // Keep track of which note is configured for each slot (for preview or edit purposes)
  const [slotNotesConfig, setSlotNotesConfig] = useState<NoteInfo[]>(
    Array.from({ length: 20 }, (_, idx) => musicalNotes[idx % musicalNotes.length])
  );
  
  // Playback state of the composed melody
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(-1);
  const [selectedComposerSlot, setSelectedComposerSlot] = useState<number>(0);
  
  // Theory states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheoryNumber, setSelectedTheoryNumber] = useState<number | null>(null);
  
  // Audio & Timer Refs
  const playbackTimeoutRef = useRef<number | null>(null);
  const audioInitializedRef = useRef(false);

  // Initialize audio helper
  const initializeAudio = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      setAudioEnabled(true);
      audioInitializedRef.current = true;
    }
  };

  // Safe click plays sound and activates audio if not done
  const handlePlayNotePreview = (note: NoteInfo) => {
    initializeAudio();
    playTone(note.frequency, instrument, 0.4, 0.3);
  };

  // Generate 20 random, non-repeating questions
  const startNewQuiz = () => {
    initializeAudio();
    const selectedNumbers: number[] = [];
    
    // Select 20 unique numbers from 1 to 100
    while (selectedNumbers.length < 20) {
      const rand = Math.floor(Math.random() * 100) + 1;
      if (!selectedNumbers.includes(rand)) {
        selectedNumbers.push(rand);
      }
    }

    const newQuestions = selectedNumbers.map((num) => {
      const correct = getSpanishNumberName(num);
      
      // Select 3 random incorrect options
      const incorrectSet = new Set<string>();
      while (incorrectSet.size < 3) {
        const randWrong = Math.floor(Math.random() * 100) + 1;
        if (randWrong !== num) {
          incorrectSet.add(getSpanishNumberName(randWrong));
        }
      }
      
      const options = [correct, ...Array.from(incorrectSet)];
      
      // Shuffle options using Fisher-Yates
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        targetNumber: num,
        armenianName: getArmenianNumberName(num),
        correctSpanish: correct,
        options
      };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnsweredCorrectly(null);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setEarnedMelody(Array(20).fill(null));
    setQuizState("playing");
    
    // Reset playback
    stopMelody();
  };

  // Submit Answer
  const handleAnswerSubmit = (option: string) => {
    if (quizState !== "playing") return;
    
    initializeAudio();
    setSelectedOption(option);
    
    const correctOption = questions[currentIndex].correctSpanish;
    const isCorrect = option === correctOption;
    
    setAnsweredCorrectly(isCorrect);
    setQuizState("answered");

    // Clone Arrays to update
    const updatedMelody = [...earnedMelody];
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
      
      // Assign the user's currently configured/selected note into this correct slot
      const chosenNote = slotNotesConfig[currentIndex] || nextNoteToEarn;
      updatedMelody[currentIndex] = chosenNote;
      
      // Play perfect chime
      playSuccessChime();
    } else {
      setStreak(0);
      updatedMelody[currentIndex] = null; // rest/silent beat for wrong answer
      
      // Play error drone
      playFailureDrone();
    }
    
    setEarnedMelody(updatedMelody);
  };

  // Go to next question or finish quiz
  const handleNextQuestion = () => {
    if (currentIndex < 19) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnsweredCorrectly(null);
      setQuizState("playing");
      
      // Set default selected note for the next question to be mapped into next index slot configuration
      if (slotNotesConfig[currentIndex + 1]) {
        setNextNoteToEarn(slotNotesConfig[currentIndex + 1]);
      }
    } else {
      setQuizState("finished");
      setActiveTab("melody"); // auto switch to view full melody workstation on finish
    }
  };

  // Melody Playback loop
  const stopMelody = () => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    setIsPlayingMelody(false);
    setCurrentPlaybackIndex(-1);
  };

  const playSequenceStep = (index: number, melodyToPlay: (NoteInfo | null)[]) => {
    if (index >= 20) {
      if (isLooping) {
        playbackTimeoutRef.current = window.setTimeout(() => {
          playSequenceStep(0, melodyToPlay);
        }, 300);
      } else {
        stopMelody();
      }
      return;
    }

    setCurrentPlaybackIndex(index);
    const note = melodyToPlay[index];
    const stepDuration = 60 / tempoBpm; // beat length in seconds

    if (note) {
      playTone(note.frequency, instrument, stepDuration * 0.9, 0.35);
    }

    playbackTimeoutRef.current = window.setTimeout(() => {
      playSequenceStep(index + 1, melodyToPlay);
    }, stepDuration * 1000);
  };

  const startMelodyPlayback = () => {
    initializeAudio();
    stopMelody();
    setIsPlayingMelody(true);
    playSequenceStep(0, earnedMelody);
  };

  // Let the user listen to a preview of standard notes sequence to hear instrument
  const playPreviewScale = () => {
    initializeAudio();
    stopMelody();
    setIsPlayingMelody(true);
    
    // Play active configs or scale
    const mockMelody = Array.from({ length: 20 }, (_, i) => {
      return earnedMelody[i] || slotNotesConfig[i] || musicalNotes[i % musicalNotes.length];
    });
    
    playSequenceStep(0, mockMelody);
  };

  // Change configured note for a specific session code slot
  const changeSlotNote = (slotIdx: number, note: NoteInfo) => {
    // Play preview
    handlePlayNotePreview(note);
    
    // Update active configurations
    const updatedConfigs = [...slotNotesConfig];
    updatedConfigs[slotIdx] = note;
    setSlotNotesConfig(updatedConfigs);
    
    // If we already earned a note in this slot, let user update it live for composing
    if (earnedMelody[slotIdx] !== null) {
      const updatedMelody = [...earnedMelody];
      updatedMelody[slotIdx] = note;
      setEarnedMelody(updatedMelody);
    }

    // Set as active selected note
    setNextNoteToEarn(note);
  };

  // Autogenerate a funny fully-correct melody template helper so users can hear full composition
  const autoFillSampleMelody = () => {
    initializeAudio();
    const updatedMelody = slotNotesConfig.map((note) => note);
    setEarnedMelody(updatedMelody);
    setScore(20);
    setQuizState("finished");
    playSuccessChime();
  };

  // Reset entire workbook
  const resetAllProgress = () => {
    stopMelody();
    setQuizState("not_started");
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnsweredCorrectly(null);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setEarnedMelody(Array(20).fill(null));
    setActiveTab("quiz");
  };

  // Filter dictionary for theory search
  const filteredNumbers = numberDatabase.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.number.toString().includes(searchLower) ||
      item.armenian.toLowerCase().includes(searchLower) ||
      item.spanish.toLowerCase().includes(searchLower)
    );
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div id="app_root" className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white pb-10">
      
      {/* HEADER SECTION */}
      <header id="app_header" className="backdrop-blur-md bg-slate-950/60 sticky top-0 z-50 border-b border-white/10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse-slow">
              <Music className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                Իսպաներեն Թվեր և Մեղեդի
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  1-100 Թվեր
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium font-sans">
                Սովորեք իսպաներեն թվերը հայերենից և ստեղծեք ձեր սեփական մեղեդին ճիշտ պատասխաններով
              </p>
            </div>
          </div>

          {/* Sound Activation Banner / Control */}
          <div className="flex items-center gap-2">
            {!audioEnabled ? (
              <button
                id="btn_enable_audio"
                onClick={initializeAudio}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer animate-bounce"
              >
                <VolumeX className="w-4 h-4 animate-pulse" />
                Միացնել ձայնը
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-500/15 text-teal-200 border border-teal-500/30 text-xs font-semibold">
                <Volume2 className="w-4 h-4 text-teal-400" />
                Ձայնը միացված է
              </div>
            )}

            <button
              onClick={resetAllProgress}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              title="Մաքրել բոլոր տվյալները"
            >
              Վերասկսել
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="border-t border-white/10 bg-white/5">
          <div className="max-w-6xl mx-auto px-4 flex gap-1">
            <button
              id="tab_btn_quiz"
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "quiz"
                  ? "border-teal-400 text-teal-300 bg-white/5"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Վիկտորինա (20 Հարց)
              {quizState === "playing" && (
                <span className="ml-1 w-2.5 h-2.5 rounded-full bg-emerald-450 animate-ping" />
              )}
            </button>

            <button
              id="tab_btn_melody"
              onClick={() => setActiveTab("melody")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "melody"
                  ? "border-indigo-400 text-indigo-300 bg-white/5"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Music className="w-4 h-4" />
              Իմ Մեղեդին
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10">
                {earnedMelody.filter(n => n !== null).length} / 20
              </span>
            </button>

            <button
              id="tab_btn_theory"
              onClick={() => setActiveTab("theory")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "theory"
                  ? "border-amber-400 text-amber-300 bg-white/5"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Տեսություն (1-100)
            </button>
          </div>
        </div>
      </header>

      {/* CORE FRAMEWORK CONTENT */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-6">

        {/* 1. QUIZ TAB PANEL */}
        {activeTab === "quiz" && (
          <div id="panel_quiz" className="space-y-6">
            
            {/* NOT STARTED / ENTRY VIEW */}
            {quizState === "not_started" && (
              <div className="glass-panel-heavy p-8 text-center max-w-2xl mx-auto space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500/20 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(99,102,241,0.3)] text-3xl font-bold animate-pulse-slow">
                  🎲
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-white tracking-wide">
                    Պատրա՞ստ եք ստեղծել ձեր հերթական երաժշտությունը
                  </h2>
                  <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                    Վիկտորինան բաղկացած է <strong>20 հարցից</strong>:
                    Յուրաքանչյուր ճիշտ պատասխանած հարցի համար դուք կստանաք <strong>ձեր ընտրած նոտան</strong>:
                    Սխալ պատասխանների դեպքում նոտա չի ավելանա, այլ կլինի դադար (լռություն):
                    Վերջում դուք կլսեք ձեր սեփական մեղեդին!
                  </p>
                </div>

                {/* Pre-select instrument section */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-left space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    նախընտրելի գործիքը՝
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {instruments.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => { setInstrument(inst.id); playTone(440, inst.id, 0.3, 0.2); }}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          instrument === inst.id
                            ? "bg-white/15 border-indigo-400 text-white font-bold ring-2 ring-indigo-500/25"
                            : "bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-lg">{inst.emoji}</span>
                        <span className="text-xs truncate">{inst.name.split("/")[1] || inst.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="btn_start_quiz"
                    onClick={startNewQuiz}
                    className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white font-black text-base transition-all transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    🎲 Սկսել մրցույթը
                    <ArrowRight className="w-5 h-5 animate-pulse" />
                  </button>
                </div>

                <div className="pt-4 border-t border-white/15 flex items-center justify-center gap-4 text-slate-400 text-xs font-semibold">
                  <span>🎯 20 Պատահական հարցեր</span>
                  <span>•</span>
                  <span>🎼 1-100 Թվերի տեսություն</span>
                  <span>•</span>
                  <span>🎹 MIDI Սինթեզ ձեր ձեռքերում</span>
                </div>
              </div>
            )}

            {/* LIVE QUIZ PLAYING / ANSWERED PANEL */}
            {(quizState === "playing" || quizState === "answered") && questions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left & Middle Column: Question and options block */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Status Bar Grid with Music Slots */}
                  <div className="glass-panel p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-350">
                      <span className="flex items-center gap-1">
                        Հարց {currentIndex + 1}-ը 20-ից
                      </span>
                      <span className="flex items-center gap-1.5 bg-indigo-500/15 text-indigo-200 px-2.5 py-1 rounded-full border border-indigo-500/30">
                        ⚡️ Սերիա (streak)՝ {streak}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Ճիշտ՝ {score} / 20
                      </span>
                    </div>

                    {/* Progress grid (20 slots) */}
                    <div className="grid grid-cols-10 gap-1.5 md:gap-2">
                      {Array.from({ length: 20 }).map((_, idx) => {
                        const isCurrent = idx === currentIndex;
                        const isAnswered = idx < currentIndex || (idx === currentIndex && quizState === "answered");
                        const answerCorrect = isAnswered ? earnedMelody[idx] !== null : null;
                        
                        let slotColor = "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10";
                        if (isCurrent && quizState === "playing") {
                          slotColor = "bg-indigo-500/25 border-indigo-400 text-white ring-2 ring-indigo-500/30 scale-105";
                        } else if (isAnswered) {
                          slotColor = answerCorrect 
                            ? "bg-emerald-500/80 border-emerald-600 text-white shadow-xs" 
                            : "bg-rose-500/80 border-rose-600 text-white/95";
                        }

                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              // If they click on already earned slots, they can preview the note!
                              if (earnedMelody[idx]) {
                                handlePlayNotePreview(earnedMelody[idx]!);
                              }
                            }}
                            className={`h-11 md:h-12 border rounded-xl flex flex-col items-center justify-center font-mono text-center select-none cursor-pointer transition-all ${slotColor}`}
                            title={`Սլոթ ${idx + 1}`}
                          >
                            <span className="text-[10px] font-bold leading-none">{idx + 1}</span>
                            <span className="text-[11px] font-bold leading-none mt-1">
                              {isAnswered ? (
                                answerCorrect ? earnedMelody[idx]?.name : "❌"
                              ) : (
                                slotNotesConfig[idx]?.name.slice(0, 3)
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium text-center">
                      💡 Սեղմեք կանաչ սլոթների վրա՝ նվագելու համար ։
                    </div>
                  </div>

                  {/* Main Question Card */}
                  <div className="glass-panel p-6 md:p-8 space-y-8 relative overflow-hidden">
                    
                    {/* Tiny spanish flag stylized badge */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500" />

                    <div className="space-y-4 text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                        Գուշակեք թարգմանությունը
                      </span>
                      
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-4xl md:text-5xl font-extrabold text-white font-mono tracking-tight bg-slate-950/60 border border-white/10 rounded-2xl px-5 py-3 shadow-inner">
                          {questions[currentIndex].targetNumber}
                        </span>
                        <div className="text-left">
                          <h3 className="text-2xl md:text-3xl font-extrabold text-indigo-300 hover:text-indigo-200 transition-colors">
                            «{questions[currentIndex].armenianName}»
                          </h3>
                          <p className="text-xs font-semibold text-slate-300">իսպաներեն թարգմանությունը՝</p>
                        </div>
                      </div>
                    </div>

                    {/* Multiple-choice options list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
                      {questions[currentIndex].options.map((option, oIdx) => {
                        const isSelected = selectedOption === option;
                        const isCorrectOption = option === questions[currentIndex].correctSpanish;
                        
                        let optionStyle = "bg-slate-900/90 hover:bg-slate-800/95 border-white/15 text-white shadow-md hover:border-indigo-400";
                        
                        // Style states after answer
                        if (quizState === "answered") {
                          if (isCorrectOption) {
                            optionStyle = "bg-emerald-600 border-emerald-500 text-white shadow-lg font-bold ring-4 ring-emerald-500/30 scale-[1.01]";
                          } else if (isSelected && !isCorrectOption) {
                            optionStyle = "bg-rose-600 border-rose-500 text-white font-bold shadow-lg opacity-90";
                          } else {
                            optionStyle = "bg-slate-950/60 border-white/5 text-slate-500 opacity-30";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              if (quizState === "playing") {
                                handleAnswerSubmit(option);
                              }
                            }}
                            disabled={quizState === "answered"}
                            className={`p-4 md:p-5 text-left rounded-2xl border text-base font-bold transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                          >
                            <span className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-mono font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="font-mono tracking-wide lowercase">{option}</span>
                            </span>

                            {quizState === "answered" && isCorrectOption && (
                              <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                            )}
                            {quizState === "answered" && isSelected && !isCorrectOption && (
                              <XCircle className="w-5 h-5 text-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Result and Next Actions banner */}
                    {quizState === "answered" && (
                      <div className={`p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse-slow ${
                        answeredCorrectly 
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-200"
                          : "bg-rose-500/15 border border-rose-500/30 text-rose-200"
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {answeredCorrectly ? "🎉 ¡Excelente!" : "😢 ¡Vaya!"}
                          </span>
                          <div>
                            <p className="text-sm font-bold">
                              {answeredCorrectly 
                                ? "Ճիշտ է։ Ձեր նախընտրած նոտան ավելացվել է!" 
                                : `Սխալ է։ Ճիշտ տարբերակն է՝ "${questions[currentIndex].correctSpanish}"`
                              }
                            </p>
                            <p className="text-xs opacity-80">
                              {answeredCorrectly 
                                ? `Հաջողությամբ վաստակել եք "${slotNotesConfig[currentIndex]?.name}" նոտան!` 
                                : "Այս սլոթը կմնա դատարկ: Փորձեք հաջորդը!"
                              }
                            </p>
                          </div>
                        </div>

                        <button
                          id="btn_next_question"
                          onClick={handleNextQuestion}
                          className="w-full md:w-auto px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          {currentIndex === 19 ? "Տեսնել արդյունքը" : "Հաջորդ հարցը"}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                  </div>

                </div>

                {/* Right Column: Mini keyboard config & Live previews */}
                <div className="space-y-6">
                  
                  {/* Next Note Selection Configurator */}
                  <div className="glass-panel p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                      <Music className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Նոտայի կարգավորում (Composer)</h4>
                        <p className="text-[11px] text-slate-450 font-medium">Ընտրեք հաջորդ ճիշտ պատասխանի նոտան</p>
                      </div>
                    </div>

                    {/* Selected Note Showcase card */}
                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${slotNotesConfig[currentIndex]?.color || nextNoteToEarn.color} flex items-center justify-center text-white text-sm font-extrabold shadow-sm font-mono`}>
                          {slotNotesConfig[currentIndex]?.letter || nextNoteToEarn.letter}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            հարց {currentIndex + 1}-ի նոտան
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Հնչունաբանություն՝ <strong className="text-indigo-300">«{slotNotesConfig[currentIndex]?.name || nextNoteToEarn.name}»</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlayNotePreview(slotNotesConfig[currentIndex] || nextNoteToEarn)}
                        className="p-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-lg shadow-2xs text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                        title="Լսել փորձնական"
                      >
                        🔊 Լսել
                      </button>
                    </div>

                    {/* Palette of notes to choose from */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Փոխել այս հարցի նոտան (կոմպոզիտորի վահանակ)՝
                      </label>
                      
                      <div className="grid grid-cols-4 gap-1.5">
                        {musicalNotes.map((note) => {
                          const isConfiguredForThisSlot = slotNotesConfig[currentIndex]?.id === note.id;
                          return (
                            <button
                              key={note.id}
                              onClick={() => changeSlotNote(currentIndex, note)}
                              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center font-mono ${
                                isConfiguredForThisSlot
                                  ? "bg-indigo-505 bg-indigo-500 border border-indigo-400 text-white shadow-md scale-105"
                                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                              title={note.name}
                            >
                              <div className="text-[9px] text-slate-400 leading-none">{note.name}</div>
                              <div className="text-xs mt-0.5 leading-none">{note.letter}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={autoFillSampleMelody}
                        className="w-full py-2 border border-dashed border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        title="Սիմուլացնել ճիշտ պատասխաններով ցույց տալու համար"
                      >
                        ⚡️ Ստեղծել պատրաստի մեղեդի (Ավտոմատ)
                      </button>
                    </div>

                  </div>

                  {/* Cheat sheet snippet card */}
                  <div className="glass-panel p-5 text-white space-y-4">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-bold">Հուշումներ (Arm-Esp)</h4>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-300 font-medium">
                      <li>• 11-15-ը ստանում են <strong className="text-indigo-300 font-mono">-ce</strong> վերջավորություն. <span className="text-indigo-200">once, doce, trece...</span></li>
                      <li>• 16-19-ը ստանում են <strong className="text-indigo-300 font-mono">dieci-</strong> նախածանց. <span className="text-indigo-200">diecisiete...</span></li>
                      <li>• 21-29-ը ստանում են <strong className="text-indigo-300 font-mono">veinti-</strong> նախածանց. <span className="text-indigo-200">veintidós...</span></li>
                    </ul>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* 2. MELODY WORKSPACE TAB PANEL */}
        {activeTab === "melody" && (
          <div id="panel_melody" className="space-y-6 max-w-4xl mx-auto">
            
            {/* Studio Header block containing stats */}
            <div className="glass-panel p-6 md:p-8 text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <Music className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Ձեր Մեղեդային Ստուդիան
                  </h2>
                  <p className="text-xs text-slate-400 font-medium font-sans">Կառավարեք և լսեք վիկտորինայի ընթացքում ստեղծված ձեր մեղեդին</p>
                </div>
              </div>

              {/* Composition Progress stats */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-450 block">Ճիշտ նոտաներ</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {earnedMelody.filter((n) => n !== null).length}
                  </span>
                </div>
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-450 block">Լռություններ (դադար)</span>
                  <span className="text-lg font-black text-rose-450 font-mono">
                    {earnedMelody.filter((n) => n === null).length}
                  </span>
                </div>
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-450 block">Ստեղծումը</span>
                  <span className="text-lg font-black text-indigo-300 font-mono">
                    {Math.round((earnedMelody.filter((n) => n !== null).length / 20) * 100)}%
                  </span>
                </div>
              </div>

              {/* COMPOSER SEQUENCE VISUALIZER (STAFF ROLL) */}
              <div className="bg-slate-950/70 rounded-2xl p-6 border border-white/10 shadow-inner relative overflow-hidden ring-4 ring-slate-950/25">
                
                {/* Visualizer Lines Background (Musical Staff Style) */}
                <div className="absolute inset-0 flex flex-col justify-around py-8 px-4 opacity-10 pointer-events-none">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-0.5 w-full bg-white" />
                  ))}
                </div>

                {/* 20 Beats Nodes Row */}
                <div className="relative z-10 grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                  {Array.from({ length: 20 }).map((_, idx) => {
                    const note = earnedMelody[idx];
                    const isPlaying = idx === currentPlaybackIndex;
                    
                    let bgStyle = "bg-white/5 border-white/10 hover:border-white/20";
                    let textStyle = "text-slate-500";
                    
                    if (note) {
                      bgStyle = note.color;
                      textStyle = "text-white";
                    }

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          if (note) {
                            handlePlayNotePreview(note);
                          }
                        }}
                        className={`h-16 border rounded-xl flex flex-col items-center justify-between p-1.5 cursor-pointer select-none transition-all shadow-sm ${bgStyle} ${
                          isPlaying 
                            ? "ring-4 ring-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.7)] brightness-110 z-20" 
                            : ""
                        }`}
                        title={note ? `${note.name} (${note.letter})` : "Դադար / Rest"}
                      >
                        {/* Playhead status highlight indicator */}
                        {isPlaying && (
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          </div>
                        )}

                        <span className={`text-[10px] font-bold leading-none ${note ? "text-white/80" : "text-slate-500"}`}>{idx + 1}</span>
                        {note ? (
                          <>
                            <span className="text-xs font-black tracking-tighter leading-none mt-1 font-mono text-white">{note.letter}</span>
                            <span className="text-[9px] font-bold opacity-90 truncate max-w-full leading-none mt-1 text-white">{note.name}</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold leading-none mt-2 text-slate-500">∅</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend or status */}
                <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>⏪ Սկիզբ</span>
                  {isPlayingMelody ? (
                    <span className="text-teal-400 animate-pulse flex items-center gap-1">
                      ● Մեղեդին նվագում է
                    </span>
                  ) : (
                    <span>Կանգնեցված է</span>
                  )}
                  <span>Ավարտ ⏩</span>
                </div>
              </div>

              {/* MASTER PLAYBACK CONTROLS PANEL */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 bg-white/5 border border-white/10 rounded-2xl">
                
                {/* Play, Stop, Loop action triggers */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-center">
                  {!isPlayingMelody ? (
                    <button
                      id="btn_play_melody"
                      onClick={startMelodyPlayback}
                      disabled={earnedMelody.every(n => n === null)}
                      className="px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-850 disabled:cursor-not-allowed text-white text-sm font-extrabold transition-all hover:scale-[1.02] shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4.5 h-4.5 fill-current" />
                      Լսել մեղեդին
                    </button>
                  ) : (
                    <button
                      id="btn_stop_melody"
                      onClick={stopMelody}
                      className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold transition-all hover:scale-[1.02] shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Square className="w-4.5 h-4.5 fill-current" />
                      Կանգնեցնել
                    </button>
                  )}

                  <button
                    id="btn_toggle_loop"
                    onClick={() => setIsLooping(!isLooping)}
                    className={`px-4 py-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isLooping
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    🔁 Կրկնել՝ {isLooping ? "Միացված" : "Անջատված"}
                  </button>

                  <button
                    onClick={playPreviewScale}
                    className="px-3.5 py-3.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 cursor-pointer"
                    title="Նվագել բոլոր նոտաները, նույնիսկ չվաստակածները"
                  >
                    🔮 Լսել Փորձնական տարբերակը
                  </button>
                </div>

                {/* Instrument configurations & Tempo parameters */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  
                  {/* Tempo BPM slider */}
                  <div className="w-full sm:w-44 text-left space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>Տեմպ (Արագություն)</span>
                      <span className="text-indigo-300 font-mono italic">{tempoBpm} BPM</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="245"
                      step="5"
                      value={tempoBpm}
                      onChange={(e) => setTempoBpm(Number(e.target.value))}
                      className="w-full accent-indigo-550 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Instrument quick change dropdown */}
                  <div className="w-full sm:w-auto text-left space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 block">Երաժշտական Գործիք</span>
                    <select
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-300 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none"
                    >
                      {instruments.map((inst) => (
                        <option key={inst.id} value={inst.id} className="bg-slate-900 text-slate-300">
                          {inst.emoji} {inst.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

              </div>

              {/* ACTION CALLOUTS FOR RE-STARTING */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                {quizState === "finished" ? (
                  <button
                    onClick={startNewQuiz}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-md cursor-pointer hover:from-indigo-650 hover:to-purple-700 transition"
                  >
                    🎲 Խաղալ նորից (20 Հարց)
                  </button>
                ) : (
                  <button
                    onClick={() => { setActiveTab("quiz"); if (quizState === "not_started") startNewQuiz(); }}
                    className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-sm hover:bg-white/10 transition cursor-pointer"
                  >
                    {quizState === "playing" ? "Շարունակել վիկտորինան" : "Սկսել վիկտորինան հիմա"}
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={autoFillSampleMelody}
                  className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-bold text-sm transition cursor-pointer"
                >
                  🧩 Լցնել պատահական նոտաներով
                </button>
              </div>

              </div>

              {/* 3D PHYSICAL INSTRUMENTS INTERACTIVE ZONE */}
              <ThreeDInstruments
                activeInstrument={instrument}
                musicalNotes={musicalNotes}
                selectedComposerSlot={selectedComposerSlot}
                setSelectedComposerSlot={setSelectedComposerSlot}
                onPlayNote={(note) => {
                  initializeAudio();
                  playTone(note.frequency, instrument, 0.5, 0.4);
                  changeSlotNote(selectedComposerSlot, note);
                }}
                slotNotesConfig={slotNotesConfig}
                earnedMelody={earnedMelody}
              />

              {/* INTERACTIVE COMPOSER VIRTUAL PIANO ROLL */}
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <Keyboard className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Ինտերակտիվ Երաժշտական Ստեղնաշար
                    </h3>
                    <p className="text-xs text-slate-400">Նվագեք կամ փոխեք առանձին սլոթների նոտաները, եթե ցանկանում եք խմբագրել ձեր ստեղծագործությունը</p>
                  </div>
                </div>

                {/* Selected Slot configure block */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-400 font-bold tracking-tight mb-3">
                    Ընտրեք Սլոթը խմբագրելու համար (ընդամենը 20 սլոթ)՝
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {Array.from({ length: 20 }).map((_, idx) => {
                      const hasEarned = earnedMelody[idx] !== null;
                      const isSelected = idx === selectedComposerSlot;
                      
                      let tabColor = "border-white/10 text-slate-450 hover:bg-white/10";
                      
                      if (hasEarned) {
                        tabColor = "bg-indigo-500/15 border-indigo-500/25 text-indigo-300 font-extrabold hover:bg-indigo-500/30";
                      }
                      
                      if (isSelected) {
                        tabColor = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold ring-2 ring-emerald-500/25";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedComposerSlot(idx);
                            const note = slotNotesConfig[idx] || earnedMelody[idx];
                            if (note) {
                              handlePlayNotePreview(note);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-all cursor-pointer ${tabColor}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Graphical Piano keyboard */}
                <div className="p-4 bg-slate-950/40 border border-white/10 rounded-2xl">
                  <div className="flex overflow-x-auto gap-1.5 pb-2 justify-center">
                    {musicalNotes.map((note) => {
                      const isUsedInSelectedSlot = slotNotesConfig[selectedComposerSlot]?.id === note.id;
                      return (
                        <button
                          key={note.id}
                          onClick={() => {
                            initializeAudio();
                            playTone(note.frequency, instrument, 0.45, 0.4);
                            changeSlotNote(selectedComposerSlot, note);
                          }}
                          className={`min-w-16 h-28 rounded-b-xl flex flex-col justify-end items-center pb-3 text-white transition-all transform active:translate-y-0.5 active:brightness-90 cursor-pointer ${note.color} relative shadow-md ${
                            isUsedInSelectedSlot ? "ring-4 ring-white scale-[1.03] z-10" : "opacity-85 hover:opacity-100"
                          }`}
                        >
                          {/* Indicator dot if configured in current slot */}
                          <div className={`w-3.5 h-3.5 rounded-full absolute top-2.5 shadow-inner transition-all ${
                            isUsedInSelectedSlot ? "bg-white scale-125" : "bg-white/20"
                          }`} />
                          
                          <span className="text-[10px] font-bold opacity-60 leading-none">{note.name}</span>
                          <span className="text-sm font-extrabold tracking-tight font-mono leading-none mt-1">{note.letter}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[10px] font-mono text-center text-slate-500 pt-2">
                    🎹 MIDI PIANO - Կտտացրեք ստեղներին՝ տվյալ նոտան ընտրված սլոտում ձայնագրելու համար ։
                  </div>
                </div>

              </div>

            </div>
        )}

        {/* 3. THEORY STUDY TAB PANEL */}
        {activeTab === "theory" && (
          <div id="panel_theory" className="space-y-6">
            
            {/* Search and filter bar for 1-100 */}
            <div className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
              
              <div className="flex items-center gap-2 text-slate-200">
                <Book className="w-6 h-6 text-indigo-400" />
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Իսպաներեն Թվերի Դասագիրք (1-100)</h2>
                  <p className="text-xs text-slate-400">Մանրամասն բացատրություն և ինտերակտիվ բոլոր 100 թվերի արտասանությունը</p>
                </div>
              </div>

              {/* Live search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Որոնել թիվը (օր.՝ 25, քսան, veinte)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                />
              </div>

            </div>

            {/* Detailed structured lesson groups */}
            {searchQuery === "" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {theoryLessons.map((lesson, idx) => (
                  <div key={idx} className="glass-panel p-6 space-y-4">
                    
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </div>
                      <h3 className="font-extrabold text-base text-white">{lesson.title}</h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{lesson.description}</p>

                    {/* Compact layout card for translation entries */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {lesson.items.map((item) => (
                        <div
                          key={item.number}
                          onClick={() => {
                            setSelectedTheoryNumber(item.number);
                            // Synthesize nice note frequency mapping based on number!
                            const noteIdx = (item.number - 1) % musicalNotes.length;
                            handlePlayNotePreview(musicalNotes[noteIdx]);
                          }}
                          className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:border-indigo-400 hover:bg-white/10 text-xs flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono bg-white/10 text-slate-250 text-slate-200 w-7 h-5 rounded-md flex items-center justify-center font-bold text-[10px]">
                              {item.number}
                            </span>
                            <span className="text-slate-300 font-semibold truncate capitalize">{item.armenian}</span>
                          </div>
                          
                          <div className="text-right truncate flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-indigo-300 tracking-wide lowercase truncate">{item.spanish}</span>
                            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">🔊</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              // Search results view
              <div className="glass-panel p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Որոնման արդյունքներ (գտնվել է {filteredNumbers.length} թիվ)
                </h3>

                {filteredNumbers.length === 0 ? (
                  <div className="text-center py-10 space-y-2 text-slate-400">
                    <span className="text-3xl">📭</span>
                    <p className="text-sm font-semibold">Ոչ մի թիվ չի գտնվել ձեր որոնմամբ ։</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredNumbers.map((item) => (
                      <div
                        key={item.number}
                        onClick={() => {
                          setSelectedTheoryNumber(item.number);
                          const noteIdx = (item.number - 1) % musicalNotes.length;
                          handlePlayNotePreview(musicalNotes[noteIdx]);
                        }}
                        className="p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:border-indigo-400 hover:bg-white/10 text-sm flex flex-col justify-between gap-1 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-white/10 text-slate-200 text-xs font-bold w-9 h-6 rounded-md flex items-center justify-center">
                            {item.number}
                          </span>
                          <span className="text-slate-350 text-xs truncate capitalize">{item.armenian}</span>
                        </div>
                        
                        <div className="text-left flex items-center justify-between pt-1">
                          <span className="font-mono font-bold text-indigo-300 text-sm tracking-wide lowercase">{item.spanish}</span>
                          <span className="text-xs">🔊</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Grammatical pattern sheet card explanation in Armenian */}
            <div className="glass-panel p-6 text-white space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Award className="w-6 h-6 text-indigo-400 animate-pulse" />
                <h3 className="text-lg font-bold text-white">Իսպաներեն թվելու կանոնների գրքույկ</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs md:text-sm text-slate-300 leading-relaxed">
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-300 border-l-2 border-indigo-400 pl-2">0 - 15 Numbers</h4>
                  <p>
                    Սրանք բացարձակ անկանոն թվեր են, որոնք պետք է սովորել անգիր։ Տասնմեկից մինչև տասնհինգ թվերը ստանում են <code className="text-rose-300 bg-white/5 px-1 py-0.5 rounded">-ce</code> վերջավորություն.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    <li>11 (once), 12 (doce)</li>
                    <li>13 (trece), 14 (catorce), 15 (quince)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-300 border-l-2 border-indigo-400 pl-2">16 - 29 Numbers</h4>
                  <p>
                    16-ից 19 թվերը կազմվում են <span className="text-indigo-200">dieci-</span> նախածանցով (dieciséis, dieciocho):
                    Քսանի շարքը (21-29) գրվում է մեկ բառով՝ <span className="text-indigo-200">veinti-</span> նախածանցով (veintiuno, veintidós)։
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    <li>16: dieciséis (ստանում է շեշտ)</li>
                    <li>22: veintidós (ստանում է շեշտ)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-300 border-l-2 border-indigo-400 pl-2">30 - 100 Numbers</h4>
                  <p>
                    30-ից սկսած տասնավորները միանում են միավորների հետ բացառապես <span className="text-indigo-200 font-bold">«y»</span> (և) տառով՝ որպես երեք առանձին բառեր։
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    <li>31: treinta y uno</li>
                    <li>42: cuarenta y dos</li>
                    <li>99: noventa y nueve</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer id="app_footer_info" className="border-t border-white/5 bg-slate-950/40 py-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
          <p>© {new Date().getFullYear()} Իսպաներեն Թվեր և Մեղեդի. Սովորեք հաճույքով ։</p>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-400 font-mono">MIDI Synth 1.0</span>
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-400 font-mono">ARM ➜ ESP</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
