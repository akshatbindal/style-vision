import React, { useEffect, useState } from 'react';
import { GeneratedImage } from '../types';

interface SlideshowModalProps {
  images: GeneratedImage[];
  onClose: () => void;
}

const SlideshowModal: React.FC<SlideshowModalProps> = ({ images, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    // Change image every 2.5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative bg-neutral-900 rounded-2xl overflow-hidden max-w-lg w-full border border-purple-500/30 shadow-2xl h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Virtual Runway</span>
            </div>
            <button
            onClick={onClose}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors focus:outline-none"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>

        {/* Image Stack for Crossfade */}
        <div className="relative flex-1 w-full bg-neutral-800 overflow-hidden">
           {images.map((img, index) => (
             <div 
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
             >
                <img 
                    src={img.imageUrl} 
                    alt={`Outfit ${index + 1}`} 
                    className="w-full h-full object-cover"
                />
             </div>
           ))}
        </div>
        
        {/* Progress Indicators */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {images.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-purple-500' : 'w-2 bg-white/30'}`}
                />
            ))}
        </div>

      </div>
    </div>
  );
};

export default SlideshowModal;