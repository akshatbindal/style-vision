import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive }) => {
  if (!isActive) return null;
  
  return (
    <div className="flex items-center justify-center gap-1 h-6">
       {[...Array(5)].map((_, i) => (
         <div
           key={i}
           className="w-1 bg-purple-400 rounded-full animate-pulse"
           style={{
             height: '100%',
             animationDelay: `${i * 0.1}s`,
             animationDuration: '0.8s'
           }}
         />
       ))}
    </div>
  );
};

export default Visualizer;
