import React, { useEffect } from 'react';
import { GeneratedImage } from '../types';

interface GeneratedImageModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
}

const GeneratedImageModal: React.FC<GeneratedImageModalProps> = ({ image, onClose }) => {
  // Auto-close the modal after 5 seconds
  useEffect(() => {
    if (!image) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [image, onClose]);

  if (!image) return null;

  const handleSave = () => {
    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = `stylevision-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-neutral-900 rounded-2xl overflow-hidden max-w-lg w-full border border-neutral-700 shadow-2xl">
        
        {/* Save Button */}
        <button
          onClick={handleSave}
          className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          title="Save Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="relative aspect-[3/4] w-full bg-neutral-800">
           {/* Image container */}
           <img 
             src={image.imageUrl} 
             alt="Generated Outfit" 
             className="w-full h-full object-cover"
           />
           
           {/* Time remaining indicator */}
           <div className="absolute top-0 left-0 w-full h-1 bg-white/20 z-20">
             <div 
                className="h-full bg-purple-500" 
                style={{ 
                    width: '100%',
                    animation: 'shrink 5s linear forwards' 
                }} 
             />
           </div>
           <style>{`
             @keyframes shrink {
               from { width: 100%; }
               to { width: 0%; }
             }
           `}</style>
        </div>
      </div>
    </div>
  );
};

export default GeneratedImageModal;