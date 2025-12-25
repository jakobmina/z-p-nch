import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { PhaseState } from '../types';

interface Props {
  data: PhaseState[];
}

export const EntropyChart: React.FC<Props> = ({ data }) => {
  const plotData = data.map((d, i) => ({ ...d, step: i }));

  return (
    <div className="w-full h-full relative" style={{ minHeight: '80px' }}>
      <ResponsiveContainer width="99%" height="99%" debounce={50}>
        <LineChart data={plotData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <XAxis dataKey="step" hide />
          <YAxis hide domain={['auto', 'auto']} />
          
          <Tooltip 
             contentStyle={{ 
               backgroundColor: 'rgba(2, 6, 23, 0.9)', 
               border: '1px solid #1e293b', 
               borderRadius: '8px',
               color: '#94a3b8', 
               fontSize: '10px',
               backdropFilter: 'blur(4px)'
             }}
             itemStyle={{ padding: 0 }}
             formatter={(value: number) => value.toFixed(5)}
             labelStyle={{ display: 'none' }}
          />
          
          <ReferenceLine y={0} stroke="#1e293b" strokeDasharray="3 3" />

          {/* Entropy Path (Purple) */}
          <Line 
              type="monotone" 
              dataKey="S" 
              stroke="#a855f7" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
              shadow="0 0 10px #a855f7"
          />
          
          {/* Operator Amplitude Path (Cyan) */}
          <Line 
              type="monotone" 
              dataKey="q" 
              stroke="#06b6d4" 
              strokeWidth={1} 
              strokeOpacity={0.3}
              dot={false} 
              isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};