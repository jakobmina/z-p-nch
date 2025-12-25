import { PhaseState, ZPinchParams } from '../types';
import { PHI, DT, DOME_RADIUS, QUANTUM_DIM } from '../constants';

// High precision math wrappers
const cos = Math.cos;
const abs = Math.abs;
const log = Math.log;
const PI = Math.PI;

// --- The Aureo Quasiperiodic Operator ---
// Formula: An = cos(pi * n) * cos(pi * phi * n)
// Behavior: Alternates sign (parity) and modulated by Phi. Never exactly 0.
export const calculateAureoOperator = (n: number): number => {
  // Parity Operator part: cos(pi * n) -> alternates +1, -1, +1...
  const parity = cos(PI * n);
  
  // Quasiperiodic part: cos(pi * phi * n)
  const quasi = cos(PI * PHI * n);
  
  return parity * quasi;
};

// --- Entropy (Information Density) ---
// We measure entropy based on the deviation from the "Golden Mean" of the operator
export const entropy = (val: number): number => {
  const target = 1.0 / PHI; // ~0.618
  const deviation = abs(abs(val) - target);
  if (deviation < 1e-9) return 0;
  return -deviation * log(deviation + 1e-9);
};

// --- Impedance Function for Quantum Audio ---
export const quasiperiodicImpedance = (t: number, q: number): number => {
  // q represents the operator value An
  // t is the time index
  // Impedance Z is modulated by the Golden Ratio Phi
  // We model it such that resonance (low impedance) occurs at certain phases
  
  // Use high precision cos and abs defined above
  const baseZ = abs(q);
  const modulation = cos(t * PHI * PI);
  return baseZ * (1.0 + 0.5 * modulation);
};

// --- Evolution (Discrete Sequence Generator) ---
export const metripleticEvolution = (state: PhaseState, dt: number, quantumMatrix: number[][] | null): PhaseState => {
  
  // 1. Advance Discrete Time
  // If we are running, we increment n. 
  // Note: 'dt' is used conceptually, but here we enforce integer steps for n.
  const n_next = Math.floor(state.n + 1);

  // 2. Calculate Aureo Operator
  const An_next = calculateAureoOperator(n_next);

  // 3. Map to Phase Space (q, p) for compatibility with other charts
  // Position q is the operator value directly.
  const q_next = An_next;
  
  // Momentum p is the discrete derivative (change from last step)
  // This drives the Z-Pinch "breathing"
  const p_next = An_next - state.An;

  // 4. Calculate Derived Properties
  const S_next = entropy(An_next);
  
  // Kappa (Impedance) drops when we are close to the Golden Ratio nodes (+- 0.381 or +- 0.618)
  const dynamicKappa = abs(An_next); 

  return {
    q: q_next,
    p: p_next,
    n: n_next,
    S: S_next,
    kappa: dynamicKappa,
    An: An_next
  };
};

// --- Detection & Z-Pinch ---

export const zpinchDensity = (r: number, z: number, params: ZPinchParams): number => {
  // Uses a Modified Bennett Equilibrium Profile
  const r_norm = r / params.R0;
  const bennett = 1.0 / Math.pow(1.0 + r_norm * r_norm * PHI, 2); 
  
  // Instability driven by the Aureo Operator value (params.beta)
  // When An is high, the pinch compresses.
  const bessel = Math.cos(3.0 * r_norm - params.t * 3.0);
  
  return params.I * bennett * (1.0 + 0.5 * params.beta * bessel);
};

export const detectRotor = (trajectory: PhaseState[]): number => {
  // In this discrete operator context, a "Rotor" or "Lock" 
  // is when the sequence stays bounded within the Golden Strip (approx 0.618)
  if (trajectory.length < 10) return 0.0;
  
  const recent = trajectory.slice(-10);
  const avgMag = recent.reduce((acc, s) => acc + abs(s.An), 0) / recent.length;
  
  // If average magnitude is close to 1/Phi, we are in a "Golden Corridor"
  const golden = 1.0 / PHI; // 0.618
  if (abs(avgMag - golden) < 0.1) return 0.9;
  
  return 0.2; 
};