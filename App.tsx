import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Cpu, Grid3x3, X, ChevronRight, Mic, MicOff, Zap, ChevronDown, ChevronUp, BarChart3, Binary, Brain, Terminal, Loader2, Activity, ShieldCheck, Waves } from 'lucide-react';
import { EntropyChart } from './components/EntropyChart';
import { ZPinchView } from './components/ZPinchView';
import { QuantumHologram } from './components/QuantumHologram';
import { PhaseState } from './types';
import { INITIAL_STATE, TRAJECTORY_LENGTH, DT } from './constants';
import { metripleticEvolution, detectRotor, calculateAureoOperator, entropy } from './utils/physics';
import { QuantumAudioManager } from './utils/quantumAudio';
import { analyzeSimulation } from './services/geminiService';

const formatSci = (num: number): string => {
  if (num === 0) return "0.0000";
  if (Math.abs(num) < 0.001 || Math.abs(num) > 1000) {
    return num.toExponential(4);
  }
  return num.toFixed(6);
};

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [trajectory, setTrajectory] = useState<PhaseState[]>([INITIAL_STATE]);
  const [step, setStep] = useState<number>(0);
  const [isDetected, setIsDetected] = useState<boolean>(false);
  const [inputN, setInputN] = useState<string>("1"); 
  
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [quantumMatrix, setQuantumMatrix] = useState<number[][] | null>(null);
  
  const [showHologramModal, setShowHologramModal] = useState<boolean>(false);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);
  
  // AI States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>("");

  const timerRef = useRef<number | null>(null);
  const audioManagerRef = useRef<QuantumAudioManager | null>(null);

  useEffect(() => {
    audioManagerRef.current = new QuantumAudioManager();
    return () => audioManagerRef.current?.cleanup();
  }, []);

  const handleDeepAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    
    const result = await analyzeSimulation({
      trajectory,
      score: detectRotor(trajectory),
      detected: isDetected,
      finalState: trajectory[trajectory.length - 1]
    });
    
    setAiReport(result);
    setIsAnalyzing(false);
  };

  const toggleMic = async () => {
    if (isMicActive) {
      audioManagerRef.current?.cleanup();
      audioManagerRef.current = new QuantumAudioManager();
      setIsMicActive(false);
    } else {
      try {
        await audioManagerRef.current?.initialize();
        setIsMicActive(true);
      } catch (e) {
        alert("Microphone access denied.");
      }
    }
  };

  const handleHologramInteraction = (x: number, y: number) => {
      if (audioManagerRef.current) {
          audioManagerRef.current.triggerSoliton(x, y);
          if (!isRunning) {
              const currentState = trajectory[trajectory.length - 1];
              const mat = audioManagerRef.current.computeQuantumState(step * 0.1, currentState.An);
              setQuantumMatrix(mat);
          }
      }
  };

  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    const startN = parseInt(inputN) || 1;
    const initAn = calculateAureoOperator(startN);
    const newState: PhaseState = {
        ...INITIAL_STATE,
        n: startN,
        An: initAn,
        q: initAn,
        p: 0,
        S: entropy(initAn)
    };
    setTrajectory([newState]);
    setStep(0);
    setIsDetected(false);
    setAiReport("");
    if (timerRef.current) clearInterval(timerRef.current);
  }, [inputN]);

  const stepSimulation = useCallback(() => {
    setTrajectory((prevTraj) => {
      const currentState = prevTraj[prevTraj.length - 1];
      let currentMatrix: number[][] | null = null;
      if (audioManagerRef.current) {
          currentMatrix = audioManagerRef.current.computeQuantumState(step * 0.1, currentState.An);
          setQuantumMatrix(currentMatrix);
      }
      const nextState = metripleticEvolution(currentState, DT, currentMatrix);
      const newTraj = [...prevTraj, nextState];
      if (newTraj.length > TRAJECTORY_LENGTH) newTraj.shift();
      return newTraj;
    });
    setStep(s => s + 1);
  }, [step]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(stepSimulation, 100); 
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, stepSimulation]);

  useEffect(() => {
    if (trajectory.length > 10) {
      const score = detectRotor(trajectory);
      setIsDetected(score > 0.5); 
    }
  }, [trajectory]);

  const currentState = trajectory[trajectory.length - 1];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex items-center justify-center p-2 sm:p-4 selection:bg-cyan-500/30">
      
      <div className="w-full max-w-6xl h-[800px] bg-slate-950 border border-slate-800 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        
        {/* Header Bar */}
        <div className="h-14 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-6 backdrop-blur-xl shrink-0">
           <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 tracking-wider text-xs uppercase opacity-90 leading-none">Metriplectic Coherence Lab</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Anchored Quasiperiodic Engine</span>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-cyan-500 animate-pulse shadow-[0_0_10px_cyan]' : 'bg-slate-700'}`} />
                 <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Clock N: {currentState.n}</span>
              </div>
           </div>
        </div>

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden">
           
           {/* Left Dashboard: Analysis & AI Output */}
           <div className="flex-[3] flex flex-col border-r border-slate-800 bg-black/40">
              
              {/* AI Report Terminal (Primary Content) */}
              <div className="flex-1 overflow-hidden flex flex-col p-6">
                 <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                       <Brain className={`w-6 h-6 ${isAnalyzing ? 'text-purple-400 animate-pulse' : 'text-purple-500'}`} />
                       <h2 className="text-sm font-bold uppercase tracking-widest text-slate-100">Deep Reasoning Analyst</h2>
                    </div>
                    {!isAnalyzing && (
                      <button 
                        onClick={handleDeepAnalysis}
                        className="px-4 py-2 bg-purple-600/20 border border-purple-500/40 rounded-lg text-[10px] font-bold uppercase tracking-widest text-purple-400 hover:bg-purple-600/30 transition-all flex items-center gap-2"
                      >
                         <Terminal className="w-3 h-3" />
                         Run Stability Analysis
                      </button>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed text-slate-300 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-purple-400/80">
                         <Loader2 className="w-8 h-8 animate-spin" />
                         <div className="flex flex-col items-center">
                           <span className="animate-pulse">SYNCHRONIZING WITH QUASIPERIODIC MOTOR...</span>
                           <span className="text-[10px] text-slate-600 mt-2 uppercase">Reasoning Budget: 32,768 Tokens</span>
                         </div>
                      </div>
                    ) : aiReport ? (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center gap-2 text-emerald-500/60 mb-4 text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                          STABILITY REPORT COMMITTED TO CONTEXT
                        </div>
                        <div className="whitespace-pre-wrap selection:bg-purple-500/20">{aiReport}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20 text-slate-500">
                         <Terminal className="w-12 h-12" />
                         <div className="text-center">
                            <p className="text-sm">NEURAL ANALYST STANDBY</p>
                            <p className="text-[10px] mt-2">Trigger analysis to leverage the stable motor coherence</p>
                         </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="h-48 border-t border-slate-800 flex flex-col bg-slate-950">
                 <div className="h-8 px-6 flex items-center justify-between border-b border-slate-900 bg-slate-900/50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Activity className="w-3 h-3" />
                       Thermodynamic Flux (Entropy)
                    </span>
                    <div className="flex gap-4 text-[10px] font-mono">
                      <span className="text-purple-400">S: {formatSci(currentState.S)}</span>
                      <span className="text-cyan-400">An: {formatSci(currentState.An)}</span>
                    </div>
                 </div>
                 <div className="flex-1 p-2">
                    <EntropyChart data={trajectory} />
                 </div>
              </div>
           </div>

           {/* Right Panel: Visualization & Controls */}
           <div className="w-[340px] flex flex-col bg-slate-900/20">
              
              {/* Static Stability View (Minimal Visual) */}
              <div className="h-[340px] relative border-b border-slate-800 bg-black flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 opacity-40 pointer-events-none">
                    <ZPinchView 
                      time={currentState.n * 0.1}
                      alpha={0.5}
                      beta={Math.abs(currentState.An)}
                      iCurrent={2000}
                      r0={1.4}
                      size={400}
                      className="rounded-full blur-3xl scale-110"
                    />
                 </div>
                 
                 <div className="z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                       <ZPinchView 
                         time={currentState.n * 0.2}
                         alpha={0.5}
                         beta={1.2}
                         iCurrent={1500}
                         r0={1.1}
                         size={180}
                         className="rounded-full border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                       />
                       <div className="absolute inset-0 border border-slate-800 rounded-full animate-ping opacity-10"></div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                       <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all ${isDetected ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-700 bg-slate-800/50 text-slate-500'}`}>
                          <Zap className={`w-3 h-3 ${isDetected ? 'animate-bounce' : ''}`} />
                          {isDetected ? "RESONANCE DETECTED" : "EVOLUTIONARY MODE"}
                       </div>
                    </div>
                 </div>

                 {/* Topology Grid */}
                 <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                      style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              </div>

              {/* Interaction Terminal */}
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                          <Binary className="w-4 h-4 text-cyan-400" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Quasiperiodic Driver</span>
                          <span className="text-xs font-mono text-cyan-400">Operator Magnitude: {Math.abs(currentState.An).toFixed(4)}</span>
                       </div>
                    </div>

                    <div className="h-px w-full bg-slate-800"></div>

                    {/* Simulation Controls */}
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => setIsRunning(!isRunning)}
                         className={`h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-bold text-[10px] tracking-widest uppercase ${isRunning ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-cyan-600 text-white shadow-lg hover:bg-cyan-500'}`}
                       >
                         {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                         {isRunning ? "Suspend" : "Initiate"}
                       </button>

                       <button onClick={resetSimulation} className="h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">
                         <RotateCcw className="w-4 h-4" />
                         Reset
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={toggleMic} className={`h-12 rounded-xl flex items-center justify-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest ${isMicActive ? 'bg-red-500/10 text-red-500 border border-red-500/40' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400'}`}>
                         {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                         Acoustics
                       </button>

                       <button onClick={() => setShowHologramModal(true)} className="h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">
                         <Grid3x3 className="w-4 h-4" />
                         Tactile
                       </button>
                    </div>
                 </div>

                 {/* Tech Overlay Button */}
                 <button 
                   onClick={() => setShowTechDetails(!showTechDetails)}
                   className={`mt-auto flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${showTechDetails ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                 >
                   <div className="flex items-center gap-2">
                     <BarChart3 className="w-4 h-4" />
                     Phyllotaxis Params
                   </div>
                   {showTechDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                 </button>
              </div>
           </div>
        </div>

        {/* Collapsible Technical Details (Overlay style) */}
        {showTechDetails && (
          <div className="h-20 bg-slate-900 border-t border-slate-800 px-8 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
             <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Projection Frame</span>
                <span className="text-xs text-slate-300 font-mono">Φ-modulated (137.5°)</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Expansion Delta</span>
                <span className="text-xs text-slate-300 font-mono">Metriplectic DT: 1.0</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Stability Metric</span>
                <span className={`text-xs font-mono ${isDetected ? 'text-amber-500' : 'text-emerald-500'}`}>
                   {isDetected ? "QUASI-LOCKED" : "STOCHASTIC"}
                </span>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Set Core Index</span>
                   <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={inputN} 
                        onChange={(e) => setInputN(e.target.value)}
                        className="w-20 bg-black/40 border border-slate-700 rounded-md text-[11px] px-2 py-1 text-cyan-400 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <button onClick={resetSimulation} className="bg-slate-800 p-1 rounded hover:bg-slate-700 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-400"/>
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>

      {/* Tactile Hologram Modal */}
      {showHologramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-[0_0_150px_rgba(8,145,178,0.2)] p-8 max-w-lg w-full relative">
              <button onClick={() => setShowHologramModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                 <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center gap-6">
                 <div className="text-center">
                    <h3 className="text-cyan-400 font-bold text-xl flex items-center justify-center gap-3">
                       <Waves className="w-5 h-5" />
                       SOLITON RECEPTOR
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase mt-2 tracking-[0.3em]">Cymatic Feedback Interface</p>
                 </div>
                 
                 <div className="relative p-1 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                    <QuantumHologram matrix={quantumMatrix} size={360} onGridInteraction={handleHologramInteraction} />
                 </div>
                 
                 <div className="w-full grid grid-cols-2 gap-4 text-[10px] font-mono border-t border-slate-800/50 pt-6">
                    <div className="flex flex-col gap-1">
                       <span className="text-slate-500 uppercase">Resonance State</span>
                       <span className="text-cyan-400">{isMicActive ? "HYBRID COHERENCE" : "TACTILE ONLY"}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                       <span className="text-slate-500 uppercase">Lock Mode</span>
                       <span className="text-purple-400">Φ-QUASI-SYMMETRY</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;