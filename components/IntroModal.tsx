import React from 'react';

interface IntroModalProps {
  onClose: () => void;
}

const IntroModal: React.FC<IntroModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-[fadeIn_0.5s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="relative bg-neutral-900 border border-purple-500/20 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(168,85,247,0.1)] overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[60px] pointer-events-none" />
         <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] pointer-events-none" />

         <div className="relative z-10 flex flex-col items-center text-center">
            {/* Logo Icon */}
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-900/20 rotate-3 transform transition-transform hover:rotate-6 hover:scale-105 duration-300">
               <span className="text-3xl filter drop-shadow-md">✨</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">StyleVision AI</h2>
            <p className="text-neutral-400 mb-8 text-sm font-medium">Your hands-free personal fashion mirror.</p>

            {/* Feature List */}
            <div className="space-y-4 w-full text-left mb-8">
               <FeatureRow 
                 icon="🎙️" 
                 title="Conversational Stylist" 
                 desc="Chat naturally for real-time fashion advice." 
               />
               <FeatureRow 
                 icon="👗" 
                 title="Re-imagine Your Look" 
                 desc="Just ask: &quot;Show me in a vintage denim jacket&quot;." 
               />
               <FeatureRow 
                 icon="🎞️" 
                 title="Compare Hands-Free" 
                 desc="Ask to see a slideshow of your generated looks." 
               />
               <FeatureRow 
                 icon="💾" 
                 title="Save Your Favorites" 
                 desc="Tell the AI to download your images anytime." 
               />
            </div>

            {/* Action Button */}
            <button 
              onClick={onClose}
              className="group relative w-full py-3.5 bg-white text-black font-bold rounded-xl transition-all duration-200 hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] shadow-lg overflow-hidden"
            >
              <span className="relative z-10">Start Styling</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-neutral-200/50 to-transparent transition-transform duration-500 skew-x-12" />
            </button>
         </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
  <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors duration-200">
     <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-black/30 rounded-lg text-lg">
        {icon}
     </div>
     <div>
        <h3 className="font-semibold text-white text-sm tracking-wide">{title}</h3>
        <p className="text-neutral-400 text-xs leading-relaxed mt-0.5">{desc}</p>
     </div>
  </div>
);

export default IntroModal;