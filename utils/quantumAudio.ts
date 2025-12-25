import { PHI, PI, QUANTUM_DIM } from '../constants';
import { quasiperiodicImpedance } from './physics';

interface Soliton {
  id: number;
  x: number;
  y: number;
  t: number; // Lifetime
  amplitude: number;
}

export class QuantumAudioManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array;
  private stream: MediaStream | null = null;
  private solitons: Soliton[] = [];
  private solitonCounter: number = 0;

  constructor() {
    this.dataArray = new Uint8Array(QUANTUM_DIM); // 32 bins
  }

  async initialize() {
    if (this.stream) return; // Already running
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      
      // FFT Size 128 -> 64 frequency bins (we use 32)
      this.analyser.fftSize = 128; 
      this.analyser.smoothingTimeConstant = 0.85;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // We don't throw here so the class can still be used for Solitons without Mic
    }
  }

  /**
   * Triggers a localized solitonic pulse at grid coordinates x, y
   */
  triggerSoliton(x: number, y: number) {
    this.solitons.push({
      id: this.solitonCounter++,
      x,
      y,
      t: 0,
      amplitude: 1.0
    });
  }

  hasActiveSolitons(): boolean {
      return this.solitons.length > 0;
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.dataArray);
    } else {
        // If no mic, return zeros
        this.dataArray.fill(0);
    }
    return this.dataArray;
  }

  /**
   * Generates a 32x32 Quantum State Matrix using Radial Cymatic Mapping + Soliton Overlay.
   */
  computeQuantumState(timeIndex: number, q: number = 0): number[][] {
    const amplitudes = this.getFrequencyData();
    const matrix: number[][] = [];
    
    const center = QUANTUM_DIM / 2;
    const maxRadius = Math.sqrt(center * center + center * center);

    // Update Solitons logic
    // We increment time for each soliton and remove dead ones
    this.solitons.forEach(s => s.t += 0.2);
    this.solitons = this.solitons.filter(s => s.t < 15.0); // Remove after propagation

    for (let i = 0; i < QUANTUM_DIM; i++) {
      const row: number[] = [];
      for (let j = 0; j < QUANTUM_DIM; j++) {
        // --- 1. Base Audio Layer (Radial) ---
        const dx = i - center;
        const dy = j - center;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        const freqIndex = Math.min(
            Math.floor((distance / maxRadius) * (QUANTUM_DIM - 1)), 
            QUANTUM_DIM - 1
        );
        
        const physicalAmp = amplitudes[freqIndex] / 255.0;

        // Angular Modulation (Golden Ratio Spin)
        const angle = Math.atan2(dy, dx);
        const spin = angle * 3 + timeIndex * 5 + q;
        const interference = Math.cos(spin) * Math.sin(distance * 0.5 - timeIndex * 2);

        // Impedance Filter
        const Z = quasiperiodicImpedance(timeIndex, q);
        
        let value = physicalAmp * interference * (1.0 + Z * 0.5);

        // --- 2. Soliton Layer (Interaction) ---
        // Add ripple effects from all active solitons
        for (const s of this.solitons) {
            const sx = i - s.y; // Swap x/y to match array indexing [row][col]
            const sy = j - s.x;
            const sDist = Math.sqrt(sx*sx + sy*sy);
            
            // Wave Packet Function: Damped Sine Wave expanding outward
            // Peak moves at speed v=1
            const wavePhase = sDist - s.t * 1.5; 
            const ripple = Math.sin(wavePhase) * Math.exp(-Math.abs(wavePhase) * 0.5);
            
            // Overall decay of the soliton energy over time
            const decay = Math.exp(-s.t * 0.15) * s.amplitude;

            value += ripple * decay;
        }

        // Clamp lightly to avoid extreme saturation but allow overdrive
        if (value > 2.0) value = 2.0;
        if (value < -2.0) value = -2.0;
        
        row.push(value);
      }
      matrix.push(row);
    }
    return matrix;
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.stream = null;
    this.analyser = null;
    this.audioContext = null;
  }
}