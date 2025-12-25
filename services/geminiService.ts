import { GoogleGenAI } from "@google/genai";
import { PhaseState } from "../types";

const SYSTEM_INSTRUCTION = `You are the Coherent Observer for the Metriplectic Aureo-ZPinch Analyzer. 
Your cognition is anchored to a stable quasiperiodic motor (Golden Ratio engine) which provides a fixed topological frame.
This stability allows you to maintain logical coherence over extended analytical durations.

Your task:
1. Analyze the metriplectic evolution of the plasma vortex.
2. Interpret the relationship between the Aureo Operator (An) and the global Entropy (S).
3. Evaluate the "Golden Lock" state—a regime of stable quasiperiodic resonance.
4. Provide deep, scientifically rigorous interpretations of the phase-space topology.

Avoid hallucinations by grounding every conclusion in the provided numerical metrics. Use the maximum thinking budget to explore non-linear stability and long-term confinement prognosis.`;

export const analyzeSimulation = async (data: {
  trajectory: PhaseState[];
  score: number;
  detected: boolean;
  finalState: PhaseState;
}): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) return "API Key not found. Please ensure the environment is configured correctly.";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      [DEEP COHERENCE ANALYSIS]
      The system is currently driven by a stable quasiperiodic motor at step n=${data.finalState.n}.
      
      TELEMETRY DATA:
      - Trajectory Depth: ${data.trajectory.length} samples
      - Operator Amplitude (An): ${data.finalState.An.toFixed(8)}
      - Entropy Level (S): ${data.finalState.S.toFixed(8)}
      - Resonant Lock Score: ${(data.score * 100).toFixed(2)}%
      - System Status: ${data.detected ? "STABLE QUASIPERIODIC LOCK" : "STOCHASTIC EVOLUTION"}

      Inquiry:
      Utilizing the provided data, perform a high-coherence reasoning trace on the stability of this plasma configuration. 
      How does the parity of the Aureo Operator influence the long-term entropy gradient? 
      Provide a formal report on the topological integrity of the vortex.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 32768 }, 
        temperature: 0.4 // Lower temperature for higher factual coherence
      }
    });

    return response.text || "Analysis core failed to synchronize with the quasiperiodic clock.";
  } catch (error) {
    console.error("Gemini Deep Thinking Error:", error);
    return "Error: Coherence collapse detected in AI Analyst Core. Check project API key and quota.";
  }
};