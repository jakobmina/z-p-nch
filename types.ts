export interface PhaseState {
  q: number; // Generalized position (Mapped to An)
  p: number; // Generalized momentum (Delta An)
  n: number; // Discrete Step Index
  S: number; // Entropy
  kappa: number; // Conductivity/Impedance
  An: number; // The Aureo Quasiperiodic Operator Value
}

export interface SimulationResult {
  trajectory: PhaseState[];
  score: number;
  detected: boolean;
  finalState: PhaseState;
}

export interface ZPinchParams {
  I: number;      // Current (kA)
  R0: number;     // Characteristic radius
  alpha: number;  // Golden structure parameter
  beta: number;   // Temporal modulation amplitude
  t: number;      // Time
}