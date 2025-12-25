import React, { useEffect, useRef, useState } from 'react';
import { PhaseState } from '../types';
import { QUANTUM_DIM, PHI } from '../constants';
import { ZPinchView } from './ZPinchView';

interface Props {
  data: PhaseState[];
  matrix: number[][] | null;
}

const GOLDEN_TARGET = 1.0 / PHI; 
const ROTOR_TOLERANCE = 0.15;

const HologramBackground: React.FC<{ matrix: number[][]; width: number; height: number }> = ({ matrix, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);
        const cellW = width / QUANTUM_DIM;
        const cellH = height / QUANTUM_DIM;

        for(let i=0; i<QUANTUM_DIM; i++) {
            for(let j=0; j<QUANTUM_DIM; j++) {
                const val = matrix[i][j];
                const intensity = Math.abs(val);
                if (intensity > 0.1) {
                    const isPositive = val >= 0;
                    ctx.fillStyle = isPositive 
                        ? `rgba(6, 182, 212, ${intensity * 0.1})` 
                        : `rgba(168, 85, 247, ${intensity * 0.1})`;
                    ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
                }
            }
        }
    }, [matrix, width, height]);

    return <canvas ref={canvasRef} width={width} height={height} className="absolute top-0 left-0 pointer-events-none opacity-30" />;
}

export const PhaseSpaceChart: React.FC<Props> = ({ data, matrix }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const lastState = data[data.length - 1];

  useEffect(() => {
    const updateSize = () => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setDimensions({ width, height });
        }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);
    
    const w = dimensions.width;
    const h = dimensions.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); 
    const scaleFactor = Math.min(w, h) / 30; 

    const isRotor = (An: number) => Math.abs(Math.abs(An) - GOLDEN_TARGET) < ROTOR_TOLERANCE;

    // 3D Perspective Projection Logic
    // z ranges from 0 (background) to 1 (foreground)
    const project = (i: number, val: number) => {
        const z = i / Math.max(1, data.length); 
        const perspective = 1 / (1.5 - z * 0.8); // Scale factor for perspective
        
        const r = scaleFactor * Math.sqrt(i + 1) * perspective;
        const theta = i * GOLDEN_ANGLE - (lastState.n * 0.005);
        
        return {
            x: cx + r * Math.cos(theta),
            y: cy + r * Math.sin(theta),
            z,
            scale: perspective
        };
    };

    // 1. Draw 3D Connectors (Trajectory lines)
    for (let i = 0; i < data.length - 1; i++) {
        const p1 = data[i];
        const p2 = data[i + 1];
        
        const proj1 = project(i, p1.An);
        const proj2 = project(i+1, p2.An);

        const inRotorZone = isRotor(p1.An) && isRotor(p2.An);

        ctx.beginPath();
        ctx.moveTo(proj1.x, proj1.y);
        ctx.lineTo(proj2.x, proj2.y);
        
        const alpha = 0.05 + proj2.z * 0.3; // Closer points are more visible

        if (inRotorZone) {
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 2.5})`; 
            ctx.lineWidth = 2 * proj2.scale;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 5 * proj2.scale;
        } else {
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 1 * proj2.scale;
            ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // 2. Draw Nodes
    data.forEach((point, i) => {
        const proj = project(i, point.An);
        const absVal = Math.abs(point.An);
        const inRotorZone = isRotor(point.An);
        
        const nodeSize = (2 + absVal * 4) * proj.scale;
        const alpha = 0.1 + proj.z * 0.6;

        if (inRotorZone) {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, nodeSize + 2 * proj.scale, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, nodeSize, 0, Math.PI * 2);

        if (point.An >= 0) {
            ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`; 
        } else {
            ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`; 
        }
        
        ctx.fill();

        // Highlight the most recent point (The Head)
        if (i === data.length - 1) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Core beam
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(proj.x, proj.y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    });

  }, [data, dimensions, lastState]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      {/* 3D Background Atmosphere */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <ZPinchView 
            time={lastState.n * 0.1}
            alpha={0.5}
            beta={Math.abs(lastState.An)}
            iCurrent={1000}
            r0={1.5}
            size={500}
            className="rounded-full blur-3xl scale-125 translate-y-[-10%]"
          />
      </div>

      {matrix && (
          <div className="absolute inset-0 z-0 opacity-50">
             <HologramBackground matrix={matrix} width={dimensions.width} height={dimensions.height} />
          </div>
      )}

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* Decorative Overlays */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none text-right">
         <div className="text-[10px] font-mono text-cyan-500/50 tracking-[0.2em] uppercase">Vortex Core Delta</div>
         <div className="h-[1px] w-32 bg-gradient-to-l from-cyan-500/40 to-transparent mt-1"></div>
      </div>
    </div>
  );
};