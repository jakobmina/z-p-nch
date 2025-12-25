import React, { useRef, useEffect } from 'react';
import { zpinchDensity } from '../utils/physics';

interface Props {
  time: number;
  alpha: number;
  beta: number;
  iCurrent: number;
  r0: number;
  size?: number;
  className?: string;
}

export const ZPinchView: React.FC<Props> = ({ 
  time, 
  alpha, 
  beta, 
  iCurrent, 
  r0, 
  size = 48, 
  className = "rounded-full border border-slate-700 bg-slate-950" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Scale drawing relative to canvas size
    const scale = width / 4; 

    // Clear background
    ctx.clearRect(0,0,width,height);
    
    // Create ImageData
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const params = { I: iCurrent, R0: r0, alpha, beta, t: time };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - centerX) / scale;
        const dy = (y - centerY) / scale;
        const r = Math.sqrt(dx * dx + dy * dy);
        
        // Z=0 for cross-section
        const density = zpinchDensity(r, 0, params);
        
        // Normalize based on Current (I)
        // Note: The new Bennett profile can peak higher or lower depending on r, 
        // but typically <= I. We clamp for safety.
        let normalized = density / iCurrent;
        
        // Enhance contrast for the visualizer
        normalized = Math.pow(Math.abs(normalized), 0.7); 
        if (normalized > 1.0) normalized = 1.0;
        
        const index = (y * width + x) * 4;
        
        let red = 0, green = 0, blue = 0;
        
        // Plasma Palette (Electric Blue -> Cyan -> White)
        if (normalized < 0.1) {
           // Outer Halo
           blue = normalized * 10 * 60;
           red = 0;
           green = 0;
        } else if (normalized < 0.5) {
           // Mid Plasma (Blue-Purple)
           blue = 180 + (normalized - 0.1) * 150; 
           green = (normalized - 0.1) * 200;
           red = (normalized - 0.1) * 100;
        } else {
           // Core (Cyan -> White)
           blue = 255;
           green = 100 + (normalized - 0.5) * 310;
           red = 40 + (normalized - 0.5) * 400;
        }

        // Clamp colors
        red = Math.min(255, Math.floor(red));
        green = Math.min(255, Math.floor(green));
        blue = Math.min(255, Math.floor(blue));

        // Circular mask with soft edge for larger views
        // Cutoff at r=1.9 (relative to scale)
        if (r > 1.9) {
            data[index + 3] = 0;
        } else if (r > 1.7) {
            // Fade out edge
            data[index] = red;
            data[index + 1] = green;
            data[index + 2] = blue;
            data[index + 3] = Math.floor(255 * (1.9 - r) / 0.2);
        } else {
            data[index] = red;
            data[index + 1] = green;
            data[index + 2] = blue;
            data[index + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

  }, [time, alpha, beta, iCurrent, r0, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className={className}
    />
  );
};