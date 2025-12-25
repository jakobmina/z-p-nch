import { PhaseState } from './types';

export const PHI = 1.618033988749895;
export const PI = Math.PI;
export const SQRT2 = Math.SQRT2;

export const TRAJECTORY_LENGTH = 64; // Reduced slightly for clearer discrete view
export const ZPINCH_SAMPLES = 64; 
export const DETECTION_THRESHOLD = 0.6;
export const DT = 1.0; // Discrete steps of 1

// The "Dome" boundary where the white noise is contained
export const DOME_RADIUS = 4.0; 

// Quantum Audio Constants
export const QUANTUM_DIM = 32; // 32x32 Matrix (5+5 qubits)
export const FFT_SIZE = 64;    // Results in 32 frequency bins

export const INITIAL_STATE: PhaseState = {
  q: 1.0,
  p: 0.0,
  n: 1.0, // Start at n=1
  S: 0.0,
  kappa: 0.1,
  An: 1.0
};