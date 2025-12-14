import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ThreeView } from './components/ThreeView';
import { ComparisonCharts } from './components/Charts';
import { askTunnelTutor } from './services/geminiService';
import { 
  TunnelShape, 
  GeoMaterial, 
  GeologicalLayer, 
  TunnelDesign, 
  AppView, 
  ConstructionMethod, 
  SimulationSettings, 
  UserProgress, 
  Flashcard 
} from './types';
import { LEARNING_MODULES } from './data/learningContent';
import { 
  CubeIcon, 
  Square3Stack3DIcon, 
  ChartBarIcon, 
  AcademicCapIcon, 
  ChatBubbleLeftRightIcon,
  BeakerIcon,
  BookOpenIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  HomeIcon,
  TrophyIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  LightBulbIcon,
  XMarkIcon,
  CheckIcon,
  TableCellsIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

// --- NEUMORPHIC DESIGN SYSTEM COMPONENTS ---

const NeuButton = ({ active, onClick, icon, label, primary }: { active?: boolean, onClick: () => void, icon: React.ReactNode, label?: string, primary?: boolean }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out
      ${active 
        ? 'bg-slate-100 shadow-neu-pressed text-blue-600' 
        : primary 
            ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
            : 'bg-slate-100 shadow-neu-flat text-slate-500 hover:text-slate-700 hover:-translate-y-0.5'
      }
    `}
  >
    <div className="w-5 h-5">{icon}</div>
    {label && <span className="font-semibold text-sm">{label}</span>}
  </button>
);

const NeuCard = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <div className={`bg-slate-100 rounded-2xl shadow-neu-flat p-6 ${className}`}>
        {children}
    </div>
);

const NeuSlider = ({ label, value, min, max, step, onChange, unit, disabled = false }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, unit?: string, disabled?: boolean }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      const num = parseFloat(e.target.value);
      if (!isNaN(num)) {
          if (num >= min && num <= max) onChange(num);
      }
  };

  const handleBlur = () => {
     let num = parseFloat(localValue);
     if (isNaN(num)) num = min;
     num = Math.max(min, Math.min(max, num));
     setLocalValue(num.toString());
     onChange(num);
  }

  return (
    <div className={`mb-6 group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between mb-3 items-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-2 bg-blue-50/50 rounded-lg p-1 border border-blue-100 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                <input 
                    type="number"
                    value={localValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    step={step}
                    className="w-16 bg-transparent text-right font-mono font-bold text-blue-600 text-xs focus:outline-none"
                />
                {unit && <span className="text-[10px] font-bold text-slate-400 pr-1">{unit}</span>}
            </div>
        </div>
        <div className="relative h-2 bg-slate-200 rounded-full shadow-inner cursor-pointer">
             <div 
                 className="absolute h-full bg-blue-500 rounded-full transition-all duration-75" 
                 style={{ width: `${((value - min) / (max - min)) * 100}%` }}
             />
             <input 
                type="range" 
                min={min} max={max} step={step} 
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
             />
             <div 
                className="w-5 h-5 bg-slate-100 rounded-full shadow-neu-flat absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all group-hover:scale-110"
                style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 10px)` }}
             >
                <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
             </div>
        </div>
        {/* Visual Step Markers (Grid Snap Aid) */}
        {step >= 0.5 && (
             <div className="w-full flex justify-between px-1 mt-1 opacity-30">
                 {Array.from({length: Math.min(20, Math.floor((max-min)/step) + 1)}).map((_, i) => (
                     <div key={i} className="w-px h-1 bg-slate-400"></div>
                 ))}
             </div>
        )}
    </div>
  );
};

const NeuToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <button 
            onClick={() => onChange(!checked)}
            className={`
                w-12 h-6 rounded-full relative transition-all duration-300
                ${checked ? 'bg-blue-100 shadow-inner' : 'bg-slate-200 shadow-inner'}
            `}
        >
            <div className={`
                w-6 h-6 rounded-full absolute top-0 shadow-neu-flat transition-all duration-300 transform scale-110
                ${checked ? 'left-6 bg-blue-600' : 'left-0 bg-slate-100'}
            `} />
        </button>
    </div>
);

// --- FLASHCARD QUIZ COMPONENT ---

const FlashcardQuiz = ({ questions, onComplete }: { questions: Flashcard[], onComplete: (score: number) => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const handleAnswer = (correct: boolean) => {
        if(correct) setScore(s => s + 1);
        setIsFlipped(false);
        if(currentIndex < questions.length - 1) {
            setTimeout(() => setCurrentIndex(i => i + 1), 300);
        } else {
            setShowResult(true);
            onComplete(correct ? score + 1 : score);
        }
    };

    if(showResult) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="bg-white rounded-2xl p-8 text-center shadow-neu-flat animate-in zoom-in">
                <TrophyIcon className={`w-16 h-16 mx-auto mb-4 ${percentage > 70 ? 'text-yellow-500' : 'text-slate-400'}`} />
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Quiz Complete!</h3>
                <p className="text-slate-500 mb-6">You scored {percentage}%</p>
                <NeuButton onClick={() => setShowResult(false)} primary label="Continue Learning" icon={<ArrowPathIcon />} />
            </div>
        );
    }

    const card = questions[currentIndex];
    return (
        <div className="max-w-md mx-auto">
            <div className="mb-4 flex justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Card {currentIndex + 1} / {questions.length}</span>
                <span>{card.type}</span>
            </div>
            
            <div 
                className="relative h-64 perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-neu-flat p-8 flex flex-col items-center justify-center text-center border-2 border-slate-50">
                        <LightBulbIcon className="w-12 h-12 text-blue-100 mb-4" />
                        <h4 className="text-lg font-bold text-slate-700">{card.question}</h4>
                        <p className="text-xs text-slate-400 mt-8">(Click to flip)</p>
                    </div>

                    {/* Back */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-blue-600 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center text-white">
                        <p className="text-md font-medium">{card.answer}</p>
                    </div>
                </div>
            </div>

            {isFlipped && (
                <div className="flex gap-4 mt-8 animate-in slide-in-from-bottom-4">
                    <button onClick={() => handleAnswer(false)} className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
                        <XMarkIcon className="w-5 h-5"/> Missed It
                    </button>
                    <button onClick={() => handleAnswer(true)} className="flex-1 bg-green-100 text-green-600 py-3 rounded-xl font-bold hover:bg-green-200 transition-colors flex items-center justify-center gap-2">
                        <CheckIcon className="w-5 h-5"/> Got It
                    </button>
                </div>
            )}
        </div>
    );
};

// --- APP COMPONENT ---

const DEFAULT_DESIGN: TunnelDesign = {
  shape: TunnelShape.Circular,
  width: 6,
  height: 6,
  wallThickness: 0.3,
  depth: 20,
  method: ConstructionMethod.TBM,
  segmentCount: 6,
  ringWidth: 1.5,
  boltLength: 3,
  boltSpacing: 1.5,
  horizontalRadius: 1000, // Straight-ish
  verticalGrade: 0 // Flat
};

const DEFAULT_SIMULATION: SimulationSettings = {
  waterTableLevel: -5,
  natmSequence: 3,
  deviation: 0,
  showStress: false,
  showGrouting: false,
  showAlignment: false,
  showBorehole: true,
  showBMD: false,
  showSettlement: false,
  showHydrostaticVectors: false
};

const DEFAULT_LAYERS: GeologicalLayer[] = [
  { id: '1', type: GeoMaterial.SoftClay, thickness: 15, color: '#8B4513', density: 18, permeability: 'Low', spt_n: 12 }, // Clay color
  { id: '2', type: GeoMaterial.Sand, thickness: 10, color: '#F4A460', density: 20, permeability: 'High', spt_n: 35 }, // Sand color
  { id: '3', type: GeoMaterial.SoundRock, thickness: 40, color: '#708090', density: 25, permeability: 'Low', rqd: 85 }, // Rock color
];

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.Dashboard);
  const [design, setDesign] = useState<TunnelDesign>(DEFAULT_DESIGN);
  const [layers, setLayers] = useState<GeologicalLayer[]>(DEFAULT_LAYERS);
  const [simulation, setSimulation] = useState<SimulationSettings>(DEFAULT_SIMULATION);
  const [slicePosition, setSlicePosition] = useState(50);
  
  // Interaction State
  const [highlightedLayerId, setHighlightedLayerId] = useState<string | null>(null);
  const [snapGrid, setSnapGrid] = useState(true);
  
  // Learning & Gamification State
  const [activeModuleId, setActiveModuleId] = useState<string>(LEARNING_MODULES[0].id);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress>({
      modulesCompleted: 0, 
      totalModules: 10,
      designBadge: false,
      geologyBadge: false,
      xp: 0,
      level: 1
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', sub: '' });

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{role: 'ai', text: 'Hello! I am Professor TunnelViz. Ask me about your design or tunnel engineering concepts.'}]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatOpen, isTyping]);

  // Calculations
  const calculations = useMemo(() => {
    const radius = design.width / 2;
    let area = 0;
    
    if (design.shape === TunnelShape.Circular) {
      area = Math.PI * Math.pow(radius, 2);
    } else if (design.shape === TunnelShape.Rectangular) {
      area = design.width * design.height;
    } else {
      area = (Math.PI * Math.pow(radius, 2) / 2) + (design.width * design.height * 0.5); 
    }
    const excavationVol = area * 100; // per 100m
    
    // Overburden
    let pressure = 0;
    let depthCount = 0;
    for (const layer of layers) {
      if (depthCount + layer.thickness > design.depth) {
        const remaining = design.depth - depthCount;
        pressure += remaining * layer.density;
        break;
      } else {
        pressure += layer.thickness * layer.density;
        depthCount += layer.thickness;
      }
    }
    return { area, excavationVol, pressure };
  }, [design, layers]);

  const handleAiAsk = async () => {
    if (!chatQuery.trim()) return;
    const userMsg = chatQuery;
    setChatQuery('');
    setIsTyping(true);
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    const context = `Current Design: ${design.method} Method, ${design.shape} shape, Width ${design.width}m, Depth ${design.depth}m. 
    Geology includes: ${layers.map(l => l.type).join(', ')}. 
    Calculated Overburden Pressure: ${calculations.pressure.toFixed(1)} kPa.`;

    try {
      const responseText = await askTunnelTutor(userMsg, context);
      setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the server. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveDesign = () => {
      setTimeout(() => {
          setModalMessage({ title: 'Design Saved!', sub: '+50 XP Earned' });
          setShowSuccessModal(true);
          setUserProgress(prev => ({ ...prev, designBadge: true, xp: prev.xp + 50 }));
      }, 500);
      setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const handleQuizComplete = (score: number) => {
      const xpGain = score * 10;
      setQuizMode(false);
      setModalMessage({ title: 'Quiz Completed!', sub: `+${xpGain} XP Earned` });
      setShowSuccessModal(true);
      setUserProgress(prev => {
          const newXp = prev.xp + xpGain;
          const newLevel = Math.floor(newXp / 200) + 1;
          return { ...prev, xp: newXp, level: newLevel };
      });
      setTimeout(() => setShowSuccessModal(false), 3000);
  };
  
  const handleNavigation = (view: AppView, moduleId?: string) => {
      setCurrentView(view);
      if (moduleId) {
          setActiveModuleId(moduleId);
          setActiveChapterIndex(0);
          setQuizMode(false);
      }
  };

  const activeModule = LEARNING_MODULES.find(m => m.id === activeModuleId) || LEARNING_MODULES[0];
  const activeChapter = activeModule.chapters[activeChapterIndex] || activeModule.chapters[0];
  const hasQuiz = activeModule.quiz && activeModule.quiz.length > 0;
  const isModuleLocked = userProgress.xp < activeModule.requiredXP;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar Navigation - Glassmorphic */}
      <aside className="w-20 lg:w-24 bg-white/40 backdrop-blur-xl border-r border-white/50 flex flex-col items-center py-8 gap-6 z-30 shadow-lg">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl shadow-neu-icon flex items-center justify-center mb-4">
          <span className="font-bold text-white text-xl">T</span>
        </div>
        
        <nav className="flex-1 space-y-4 w-full px-2">
            {[
                { id: AppView.Dashboard, icon: <HomeIcon /> },
                { id: AppView.Designer, icon: <CubeIcon /> },
                { id: AppView.Simulator, icon: <Square3Stack3DIcon /> },
                { id: AppView.Comparator, icon: <ChartBarIcon /> },
                { id: AppView.Learn, icon: <AcademicCapIcon /> },
            ].map((item) => (
                <button 
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full p-4 rounded-xl transition-all duration-300 group relative flex justify-center ${currentView === item.id ? 'bg-white shadow-neu-pressed text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="w-6 h-6">{item.icon}</div>
                    <span className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {item.id}
                    </span>
                </button>
            ))}
        </nav>

        <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-slate-200 shadow-neu-flat overflow-hidden border-2 border-slate-100 relative group cursor-pointer">
                <div className="w-full h-full bg-gradient-to-tr from-indigo-400 to-purple-400"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs drop-shadow-md">Lvl {userProgress.level}</div>
             </div>
             <div className="text-[10px] font-bold text-slate-400">{userProgress.xp} XP</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Header - Transparent */}
        <header className="h-20 flex items-center justify-between px-8 z-20">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{currentView}</h1>
               <p className="text-xs text-slate-400 font-medium">Tunnel Engineering Platform v2.0</p>
            </div>
            <NeuButton 
                onClick={() => setChatOpen(!chatOpen)}
                icon={<ChatBubbleLeftRightIcon />}
                label="AI Tutor"
                active={chatOpen}
            />
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-8 scroll-smooth z-10">
          
          {/* DASHBOARD VIEW */}
          {currentView === AppView.Dashboard && (
             <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Welcome Hero */}
                 <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group flex flex-col justify-center min-h-[340px]">
                     <div className="relative z-10">
                         <h2 className="text-3xl font-bold mb-2">Welcome back, Engineer.</h2>
                         <p className="text-blue-100 mb-6 max-w-md">You've completed {userProgress.modulesCompleted} out of {userProgress.totalModules} modules. Level {userProgress.level} is just around the corner.</p>
                         <button onClick={() => setCurrentView(AppView.Learn)} className="bg-white text-blue-700 px-6 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform">
                             Resume Learning
                         </button>
                     </div>
                     <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 pointer-events-none">
                         <svg viewBox="0 0 200 200" className="h-full w-full animate-spin-slow">
                             <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="20" fill="none" strokeDasharray="40 10" />
                         </svg>
                     </div>
                 </div>

                 {/* Progress Ring Card */}
                 <NeuCard className="lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[340px]">
                     <div className="absolute top-[-20px] right-[-20px] opacity-5 rotate-12 pointer-events-none">
                        <TrophyIcon className="w-48 h-48 text-blue-900" />
                     </div>
                     
                     <div className="w-full flex justify-between items-center mb-6 z-10">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-slate-700 text-lg">Mastery</h3>
                            <span className="text-xs text-slate-400 font-medium">Engineer Rank</span>
                        </div>
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-blue-200">
                            Level {userProgress.level}
                        </div>
                     </div>

                     <div className="relative w-48 h-48 mb-8 z-10 group cursor-default">
                         {/* Glow Filter Definition */}
                         <svg width="0" height="0" className="absolute">
                             <defs>
                                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#14B8A6" />
                                </linearGradient>
                                <filter id="glowShadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                                    <feColorMatrix in="blur" type="matrix" values="
                                        0 0 0 0 0.14 
                                        0 0 0 0 0.38 
                                        0 0 0 0 0.92 
                                        0 0 0 0.5 0" />
                                    <feBlend in="SourceGraphic" mode="normal" />
                                </filter>
                             </defs>
                         </svg>

                         <svg className="w-full h-full transform -rotate-90">
                             {/* Background Track */}
                             <circle cx="96" cy="96" r="86" stroke="#f1f5f9" strokeWidth="16" fill="none" className="drop-shadow-inner" />
                             {/* Progress Arc */}
                             <circle 
                                cx="96" 
                                cy="96" 
                                r="86" 
                                stroke="url(#ringGradient)" 
                                strokeWidth="16" 
                                fill="none" 
                                strokeDasharray={2 * Math.PI * 86} 
                                strokeDashoffset={2 * Math.PI * 86 * (1 - (userProgress.modulesCompleted / userProgress.totalModules))} 
                                strokeLinecap="round" 
                                className="transition-all duration-1000 ease-out"
                                filter="url(#glowShadow)"
                             />
                         </svg>
                         
                         {/* Inner Content */}
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <div className="w-32 h-32 rounded-full bg-slate-100 shadow-neu-pressed flex flex-col items-center justify-center border border-slate-200 group-hover:scale-105 transition-transform duration-300">
                                 <span className="text-4xl font-black text-slate-700 tracking-tighter">
                                    {Math.round((userProgress.modulesCompleted / userProgress.totalModules) * 100)}%
                                 </span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Complete</span>
                             </div>
                         </div>
                     </div>
                     
                     {/* Footer Stats */}
                     <div className="w-full grid grid-cols-2 gap-4 z-10">
                        <div className="bg-white/50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">Total XP</div>
                            <div className="font-mono font-bold text-slate-700">{userProgress.xp}</div>
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-slate-100 text-center">
                             <div className="text-xs text-slate-400 font-bold uppercase mb-1">Modules</div>
                             <div className="font-mono font-bold text-slate-700">{userProgress.modulesCompleted}/{userProgress.totalModules}</div>
                        </div>
                     </div>
                 </NeuCard>

                 {/* Quick Actions */}
                 <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                     {[
                         { title: 'New Design', desc: 'Start a parametric tunnel project', icon: <CubeIcon />, view: AppView.Designer },
                         { title: 'Ground Analysis', desc: 'Simulate geological layers', icon: <Square3Stack3DIcon />, view: AppView.Simulator },
                         { title: 'Method Compare', desc: 'Analyze cost & risk factors', icon: <ChartBarIcon />, view: AppView.Comparator },
                     ].map((action, i) => (
                         <button key={i} onClick={() => setCurrentView(action.view)} className="bg-slate-100 p-6 rounded-2xl shadow-neu-flat hover:shadow-neu-pressed transition-all text-left group">
                             <div className="w-12 h-12 bg-white rounded-xl shadow-neu-flat flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                 <div className="w-6 h-6">{action.icon}</div>
                             </div>
                             <h4 className="font-bold text-slate-700">{action.title}</h4>
                             <p className="text-sm text-slate-400">{action.desc}</p>
                         </button>
                     ))}
                 </div>
             </div>
          )}

          {/* DESIGNER VIEW */}
          {currentView === AppView.Designer && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              {/* Controls Panel */}
              <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2">
                <NeuCard>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <AdjustmentsHorizontalIcon className="w-4 h-4" /> Parameters
                        </div>
                        <button 
                            onClick={() => setSnapGrid(!snapGrid)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${snapGrid ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                        >
                            <TableCellsIcon className="w-3 h-3"/> Grid {snapGrid ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    
                    {/* Method Toggle */}
                    <div className="bg-slate-200 p-1 rounded-xl flex mb-8 shadow-inner">
                        {[ConstructionMethod.TBM, ConstructionMethod.NATM].map((m) => (
                            <button 
                                key={m}
                                onClick={() => setDesign({...design, method: m, shape: m === ConstructionMethod.TBM ? TunnelShape.Circular : design.shape})}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${design.method === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {m === ConstructionMethod.TBM ? 'TBM' : 'NATM'}
                            </button>
                        ))}
                    </div>

                    <NeuSlider 
                        label={design.shape === TunnelShape.Circular ? "Diameter" : "Width"} 
                        value={design.width} min={3} max={15} step={snapGrid ? 0.5 : 0.05} 
                        onChange={(v) => setDesign({...design, width: v})} unit="m"
                    />
                    
                    {design.shape !== TunnelShape.Circular && (
                         <NeuSlider 
                            label="Height" 
                            value={design.height} min={3} max={15} step={snapGrid ? 0.5 : 0.05} 
                            onChange={(v) => setDesign({...design, height: v})} unit="m"
                        />
                    )}

                    <NeuSlider 
                        label="Wall Thickness" 
                        value={design.wallThickness} min={0.1} max={1.0} step={snapGrid ? 0.05 : 0.01} 
                        onChange={(v) => setDesign({...design, wallThickness: v})} unit="m"
                    />
                    
                    <NeuSlider 
                        label="Invert Depth" 
                        value={design.depth} min={5} max={100} step={snapGrid ? 1 : 0.1} 
                        onChange={(v) => setDesign({...design, depth: v})} unit="m"
                    />

                    {/* TBM Specific Controls */}
                    {design.method === ConstructionMethod.TBM && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">TBM Settings</h4>
                             <NeuSlider 
                                label="Segments / Ring" 
                                value={design.segmentCount} min={3} max={10} step={1} 
                                onChange={(v) => setDesign({...design, segmentCount: v})}
                             />
                             <NeuSlider 
                                label="Ring Width" 
                                value={design.ringWidth} min={1.0} max={2.5} step={snapGrid ? 0.1 : 0.01} 
                                onChange={(v) => setDesign({...design, ringWidth: v})} unit="m"
                             />
                        </div>
                    )}
                    
                    {/* NATM Specific Controls */}
                    {design.method === ConstructionMethod.NATM && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">NATM Settings</h4>
                             <NeuSlider 
                                label="Rock Bolt Length" 
                                value={design.boltLength} min={1} max={6} step={snapGrid ? 0.5 : 0.1} 
                                onChange={(v) => setDesign({...design, boltLength: v})} unit="m"
                             />
                             <NeuSlider 
                                label="Bolt Spacing" 
                                value={design.boltSpacing} min={0.5} max={3.0} step={snapGrid ? 0.25 : 0.05} 
                                onChange={(v) => setDesign({...design, boltSpacing: v})} unit="m"
                             />
                        </div>
                    )}
                    
                    {/* Alignment Controls */}
                     <div className="mt-4 pt-4 border-t border-slate-200">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Alignment</h4>
                             <NeuSlider 
                                label="Vert. Grade (%)" 
                                value={design.verticalGrade} min={-5} max={5} step={snapGrid ? 0.5 : 0.1} 
                                onChange={(v) => setDesign({...design, verticalGrade: v})} unit="%"
                             />
                             <NeuSlider 
                                label="Horiz. Radius (m)" 
                                value={design.horizontalRadius} min={200} max={2000} step={snapGrid ? 100 : 10} 
                                onChange={(v) => setDesign({...design, horizontalRadius: v})} unit="m"
                             />
                    </div>

                    <div className="border-t border-slate-200 my-6 pt-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Analysis Tools</h4>
                        <NeuSlider 
                            label="Cut Plane" 
                            value={slicePosition} min={0} max={100} step={1} 
                            onChange={setSlicePosition} unit="%"
                        />
                        <NeuToggle label="Hydrostatic Pressure" checked={simulation.waterTableLevel > 0} onChange={(v) => setSimulation({...simulation, waterTableLevel: v ? 5 : -5})} />
                        {simulation.waterTableLevel > 0 && (
                            <NeuToggle label="Show Vector Field" checked={simulation.showHydrostaticVectors} onChange={(v) => setSimulation({...simulation, showHydrostaticVectors: v})} />
                        )}
                        <NeuToggle label="Stress Halo" checked={simulation.showStress} onChange={(v) => setSimulation({...simulation, showStress: v})} />
                        <NeuToggle label="Bending Moment (M)" checked={simulation.showBMD} onChange={(v) => setSimulation({...simulation, showBMD: v})} />
                        <NeuToggle label="Surface Settlement" checked={simulation.showSettlement} onChange={(v) => setSimulation({...simulation, showSettlement: v})} />
                    </div>

                    <NeuButton 
                        onClick={handleSaveDesign} 
                        primary 
                        label="Save Design" 
                        icon={<ArrowPathIcon />} 
                    />
                </NeuCard>
              </div>

              {/* 3D Visualizer */}
              <div className="lg:col-span-6 h-[500px] lg:h-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5 relative">
                 <ThreeView 
                    design={design} 
                    layers={layers} 
                    slice={slicePosition} 
                    simulation={simulation}
                    highlightedLayerId={highlightedLayerId}
                />
              </div>

              {/* Real-time Stats */}
              <div className="lg:col-span-3 space-y-6">
                 <NeuCard>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Calculations</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                            <span className="text-sm text-slate-600">Excavation Area</span>
                            <span className="text-lg font-mono font-bold text-slate-800">{calculations.area.toFixed(2)} m²</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                            <span className="text-sm text-slate-600">Spoil Vol (100m)</span>
                            <span className="text-lg font-mono font-bold text-slate-800">{calculations.excavationVol.toFixed(0)} m³</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                            <span className="text-sm text-slate-600">Overburden</span>
                            <span className="text-xl font-mono font-bold text-blue-600">{calculations.pressure.toFixed(0)} kPa</span>
                        </div>
                    </div>
                 </NeuCard>
              </div>
            </div>
          )}

          {/* SIMULATOR VIEW (Dual Panel) */}
          {currentView === AppView.Simulator && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
               <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2">
                 <NeuCard>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-800">Geological Profile</h3>
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Interactive</div>
                     </div>
                     <p className="text-slate-500 text-sm mb-6">Hover over layers to identify them in the 3D view. Adjust the GWT slider to simulate permeability.</p>
                     
                     {layers.map((layer, idx) => (
                    <div 
                        key={layer.id} 
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group"
                        onMouseEnter={() => setHighlightedLayerId(layer.id)}
                        onMouseLeave={() => setHighlightedLayerId(null)}
                    >
                        <div className="w-12 h-12 rounded-lg shadow-inner flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: layer.color }}>
                            {idx + 1}
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-700">{layer.type}</div>
                            <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                                <span className="bg-slate-100 px-1 rounded">ρ: {layer.density}</span>
                                <span className={`bg-slate-100 px-1 rounded ${layer.permeability === 'High' ? 'text-blue-500 font-bold' : ''}`}>Perm: {layer.permeability}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-mono text-slate-800 font-bold">{layer.thickness}m</span>
                        </div>
                    </div>
                    ))}
                 </NeuCard>
                 
                 <NeuCard>
                     <h4 className="font-bold text-slate-700 mb-2">Tools</h4>
                     <NeuToggle label="Show Borehole Log" checked={simulation.showBorehole} onChange={(v) => setSimulation({...simulation, showBorehole: v})} />
                     <NeuSlider 
                        label="Ground Water Table" 
                        value={simulation.waterTableLevel} min={-20} max={10} step={1} 
                        onChange={(v) => setSimulation({...simulation, waterTableLevel: v})} unit="m"
                    />
                 </NeuCard>
               </div>
               
               <div className="lg:col-span-8 bg-white rounded-3xl p-2 shadow-inner border border-slate-200 h-full flex flex-col">
                   <div className="flex-1 rounded-2xl overflow-hidden relative">
                       <ThreeView 
                            design={design} 
                            layers={layers} 
                            slice={50} 
                            simulation={{...simulation, showAlignment: false}}
                            highlightedLayerId={highlightedLayerId}
                        />
                   </div>
               </div>
            </div>
          )}

          {/* COMPARATOR VIEW */}
          {currentView === AppView.Comparator && (
             <div className="h-full flex flex-col gap-6">
                <NeuCard className="flex-1">
                  <ComparisonCharts onNavigate={handleNavigation} />
                </NeuCard>
             </div>
          )}

          {/* LEARN VIEW (Updated with XP Gating) */}
          {currentView === AppView.Learn && (
            <div className="grid grid-cols-12 gap-8 h-full">
               <div className="col-span-3 bg-white rounded-2xl shadow-neu-flat overflow-hidden flex flex-col h-full border border-slate-100">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm uppercase tracking-wider flex justify-between items-center">
                      <span>Modules</span>
                      {/* XP Bar */}
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(userProgress.xp % 200) / 2}%` }}></div>
                      </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                     {LEARNING_MODULES.map(module => {
                        const isLocked = userProgress.xp < module.requiredXP;
                        return (
                        <div key={module.id} className="mb-2">
                           <button 
                             onClick={() => { setActiveModuleId(module.id); setActiveChapterIndex(0); setQuizMode(false); }}
                             className={`w-full text-left px-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                                 activeModuleId === module.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                             }`}
                           >
                             <div className="flex items-center gap-2">
                                {isLocked && <LockClosedIcon className="w-3 h-3 text-slate-400" />}
                                <span>{module.title}</span>
                             </div>
                             {activeModuleId === module.id && <ChevronRightIcon className="w-3 h-3" />}
                           </button>
                           {activeModuleId === module.id && !isLocked && (
                             <div className="ml-4 pl-4 border-l-2 border-slate-100 mt-2 space-y-2">
                                {module.chapters.map((chapter, idx) => (
                                   <button 
                                     key={idx}
                                     onClick={() => { setActiveChapterIndex(idx); setQuizMode(false); }}
                                     className={`w-full text-left text-xs ${activeChapterIndex === idx && !quizMode ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                                   >
                                      {chapter.title}
                                   </button>
                                ))}
                                {module.quiz && (
                                    <button 
                                        onClick={() => setQuizMode(true)}
                                        className={`w-full text-left text-xs flex items-center gap-2 mt-2 ${quizMode ? 'text-purple-600 font-bold' : 'text-purple-400 hover:text-purple-600'}`}
                                    >
                                        <LightBulbIcon className="w-3 h-3" /> Quick Quiz
                                    </button>
                                )}
                             </div>
                           )}
                        </div>
                     )})}
                  </div>
               </div>

               <div className="col-span-9 bg-white rounded-2xl shadow-neu-flat p-12 overflow-y-auto border border-slate-100 relative">
                   {/* Level Badge in Reader */}
                   <div className="absolute top-8 right-8 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Level {userProgress.level}</span>
                       <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 shadow-md"></div>
                   </div>

                   {/* Content Area with Lock Logic */}
                   {isModuleLocked ? (
                       <div className="flex flex-col items-center justify-center h-full text-center">
                           <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-neu-flat">
                               <LockClosedIcon className="w-10 h-10 text-slate-400" />
                           </div>
                           <h2 className="text-2xl font-bold text-slate-700 mb-2">Module Locked</h2>
                           <p className="text-slate-500 max-w-md">You need <strong>{activeModule.requiredXP} XP</strong> to access this engineering module. Complete quizzes in previous chapters to level up!</p>
                           <div className="mt-8 bg-blue-50 px-4 py-2 rounded-lg text-blue-700 font-bold text-sm">
                               Current XP: {userProgress.xp}
                           </div>
                       </div>
                   ) : (
                       quizMode && hasQuiz ? (
                           <div className="max-w-2xl mx-auto py-12">
                               <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Module Quiz</h2>
                               <p className="text-center text-slate-500 mb-12">Test your knowledge to earn XP</p>
                               <FlashcardQuiz questions={activeModule.quiz!} onComplete={handleQuizComplete} />
                           </div>
                       ) : (
                           <>
                            <div className="flex items-center gap-2 text-blue-600 mb-6 text-xs font-bold tracking-widest uppercase">
                                <BookOpenIcon className="w-4 h-4" /> {activeModule.title}
                            </div>
                            <h1 className="text-4xl font-extrabold text-slate-900 mb-8 pb-4 border-b border-slate-100">
                                {activeChapter.title}
                            </h1>
                            <div 
                                className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl"
                                dangerouslySetInnerHTML={{ __html: activeChapter.content }}
                            />
                            
                            <div className="mt-12 flex justify-between pt-8 border-t border-slate-100">
                                <NeuButton 
                                    onClick={() => setActiveChapterIndex(i => i > 0 ? i - 1 : 0)}
                                    icon={<ChevronRightIcon className="rotate-180"/>}
                                    label="Previous"
                                />
                                {hasQuiz && activeChapterIndex === activeModule.chapters.length - 1 ? (
                                    <NeuButton 
                                        onClick={() => setQuizMode(true)}
                                        icon={<LightBulbIcon />}
                                        label="Take Quiz"
                                        primary
                                    />
                                ) : (
                                    <NeuButton 
                                        onClick={() => setActiveChapterIndex(i => i < activeModule.chapters.length - 1 ? i + 1 : i)}
                                        icon={<ChevronRightIcon />}
                                        label="Next Chapter"
                                        primary
                                    />
                                )}
                            </div>
                           </>
                       )
                   )}
               </div>
            </div>
          )}

        </div>

        {/* AI Tutor Chat Overlay */}
        {chatOpen && (
          <div className="absolute bottom-6 right-6 w-96 max-h-[600px] h-[500px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></div>
                  <h3 className="font-bold">Professor TunnelViz</h3>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-blue-200 hover:text-white">✕</button>
             </div>
             
             <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                     <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${msg.role === 'ai' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                        {msg.role === 'ai' ? 'AI' : 'Me'}
                     </div>
                     <div className={`p-3 rounded-2xl shadow-sm text-sm border max-w-[80%] ${
                        msg.role === 'ai' 
                          ? 'bg-white/80 text-slate-700 border-white' 
                          : 'bg-blue-600 text-white border-blue-600'
                     }`}>
                       {msg.role === 'ai' ? (
                           <span dangerouslySetInnerHTML={{ 
                               __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                           }} />
                       ) : msg.text}
                     </div>
                  </div>
                ))}
                {isTyping && <div className="text-xs text-slate-400 italic ml-12 animate-pulse">Thinking...</div>}
                <div ref={chatEndRef} />
             </div>

             <div className="p-4 bg-white/50 border-t border-white/50 shrink-0">
                <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                    placeholder="Ask about your tunnel..."
                    className="flex-1 bg-white/50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                   />
                   <button 
                    onClick={handleAiAsk}
                    className="bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
                   >
                     <ChevronRightIcon className="w-5 h-5" />
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Success Modal (Gamification) */}
        {showSuccessModal && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border border-green-200 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in z-50">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <CheckBadgeIcon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800">{modalMessage.title}</h4>
                    <p className="text-xs text-slate-500">{modalMessage.sub}</p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;