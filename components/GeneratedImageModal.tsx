import React from 'react';
import { GeneratedImage } from '../types';

interface GeneratedImageModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
}

const GeneratedImageModal: React.FC<GeneratedImageModalProps> = ({ image, onClose }) => {
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
           <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12">
              <p className="text-white text-sm font-medium opacity-90">
                <span className="text-purple-400 font-bold uppercase text-xs tracking-wider block mb-1">Generated Look</span>
                {image.prompt}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedImageModal;