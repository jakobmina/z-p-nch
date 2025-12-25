import React, { useRef, useEffect, useState } from 'react';
import { QUANTUM_DIM } from '../constants';
import { ZPinchView } from './ZPinchView';

interface Props {
  matrix: number[][] | null; // 32x32
  size?: number;
  onGridInteraction?: (x: number, y: number) => void;
}

export const QuantumHologram: React.FC<Props> = ({ matrix, size = 320, onGridInteraction }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
        frame++;
        setTime(frame * 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
      if (!onGridInteraction || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      let clientX, clientY;
      
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      // Calculate localized coordinates (0 to 1)
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      // Map to Grid Dimension (0 to 31)
      const gridX = Math.floor(x * QUANTUM_DIM);
      const gridY = Math.floor(y * QUANTUM_DIM);

      if (gridX >= 0 && gridX < QUANTUM_DIM && gridY >= 0 && gridY < QUANTUM_DIM) {
          onGridInteraction(gridX, gridY);
      }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / QUANTUM_DIM;

    // Clear
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, width, height);

    if (!matrix || matrix.length !== QUANTUM_DIM) {
        // Even if empty, draw a faint grid so user knows they can click
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        
        for(let i=0; i<QUANTUM_DIM; i+=4) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(width, i * cellSize);
            ctx.stroke();
        }

        ctx.fillStyle = '#334155';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("TAP TO INITIATE SOLITON", width/2, height/2);
        return;
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // Draw Radar Rings
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, width * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, width * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < QUANTUM_DIM; i++) {
      for (let j = 0; j < QUANTUM_DIM; j++) {
        const val = matrix[i][j]; 
        const intensity = Math.abs(val);
        
        if (intensity < 0.05) continue;

        const x = j * cellSize;
        const y = i * cellSize;

        const isPositive = val >= 0;
        
        let color = '';
        if (isPositive) {
            const alpha = Math.min(intensity * 1.5, 1);
            color = `rgba(6, 182, 212, ${alpha})`; 
        } else {
            const alpha = Math.min(intensity * 1.5, 1);
            color = `rgba(168, 85, 247, ${alpha})`; 
        }

        ctx.fillStyle = color;
        ctx.fillRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
      }
    }
    
    // Crosshair
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

  }, [matrix, size]);

  return (
    <div className="relative inline-block group cursor-crosshair" style={{ width: size, height: size }}>
        {/* Background Canvas (Radar/Hologram) */}
        <canvas 
            ref={canvasRef} 
            width={size} 
            height={size} 
            onMouseDown={handleInteraction}
            onTouchStart={handleInteraction}
            className="rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.15)] border border-slate-700 bg-slate-950 absolute inset-0 z-0 active:scale-[0.99] transition-transform"
            style={{ imageRendering: 'pixelated' }} 
        />
        
        {/* Central Breathing Z-Pinch */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none mix-blend-screen">
             <ZPinchView 
                time={time} 
                alpha={0.5} 
                beta={1.0} // Steady breathing for the scanner
                iCurrent={1500} 
                r0={1.2}
                size={size * 0.25} // 25% of the radar size
                className="rounded-full opacity-80"
             />
        </div>

        <div className="absolute bottom-2 right-2 z-20 text-[8px] font-mono text-cyan-500/80 bg-black/80 px-1 rounded border border-cyan-900/50 pointer-events-none">
            INTERACTIVE MATRIX
        </div>
    </div>
  );
};